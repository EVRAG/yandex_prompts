#!/usr/bin/env python3
"""
Скрипт для извлечения столов с именами (number) и capacity из API
"""
import json
import sys
from datetime import datetime
import uuid

# Пробуем использовать requests, если нет - используем urllib
try:
    import requests
    USE_REQUESTS = True
except ImportError:
    import urllib.request
    import urllib.parse
    USE_REQUESTS = False

def get_tables_from_api(reserve_date, guests_count, token, request_id=None):
    """
    Получает данные о столах из API
    
    Args:
        reserve_date: Дата в формате "YYYY-MM-DD"
        guests_count: Количество гостей
        token: Токен для API
        request_id: ID запроса (опционально, генерируется автоматически)
    
    Returns:
        Список словарей с id, number и capacity столов
    """
    url = "https://app.remarked.ru/api/v1/ApiReservesWidget"
    
    if request_id is None:
        request_id = str(uuid.uuid4())
    
    payload = {
        "method": "GetTimesWithTables",
        "token": token,
        "request_id": request_id,
        "reserve_date": reserve_date,
        "guests_count": guests_count
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        if USE_REQUESTS:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
        else:
            # Используем urllib если requests не установлен
            json_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=json_data, headers=headers)
            with urllib.request.urlopen(req) as response:
                response_text = response.read().decode('utf-8')
                data = json.loads(response_text)
        
        # Извлекаем столы из ответа
        tables = []
        
        # Проверяем структуру ответа
        if "tables" in data:
            # Если столы находятся в корне ответа
            for table_id, table_data in data["tables"].items():
                tables.append({
                    "id": table_data.get("id"),
                    "number": table_data.get("number"),
                    "capacity": table_data.get("capacity")
                })
        elif "data" in data and "tables" in data["data"]:
            # Если столы находятся в data.tables
            for table_id, table_data in data["data"]["tables"].items():
                tables.append({
                    "id": table_data.get("id"),
                    "number": table_data.get("number"),
                    "capacity": table_data.get("capacity")
                })
        else:
            # Пробуем найти столы в любой структуре
            print("Структура ответа:", json.dumps(data, indent=2, ensure_ascii=False))
            print("\nИщу столы в ответе...")
            
            # Рекурсивный поиск объектов с полями id, number, capacity
            def find_tables(obj, path=""):
                found = []
                if isinstance(obj, dict):
                    # Проверяем, является ли это объектом стола
                    if "id" in obj and "number" in obj and "capacity" in obj:
                        found.append({
                            "id": obj.get("id"),
                            "number": obj.get("number"),
                            "capacity": obj.get("capacity")
                        })
                    else:
                        # Ищем глубже
                        for key, value in obj.items():
                            found.extend(find_tables(value, f"{path}.{key}" if path else key))
                elif isinstance(obj, list):
                    for item in obj:
                        found.extend(find_tables(item, path))
                return found
            
            tables = find_tables(data)
        
        return tables, data
        
    except Exception as e:
        print(f"Ошибка при запросе к API: {e}")
        if USE_REQUESTS and hasattr(e, 'response') and e.response is not None:
            print(f"Ответ сервера: {e.response.text}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Ошибка при парсинге JSON: {e}")
        print(f"Ответ сервера: {response.text}")
        sys.exit(1)


def main():
    # Параметры по умолчанию
    token = "7608d1fa196c7b4f340dd9d0c3fbffc1"
    
    # Можно передать параметры через аргументы командной строки
    if len(sys.argv) > 1:
        reserve_date = sys.argv[1]
    else:
        # По умолчанию используем сегодняшнюю дату
        reserve_date = datetime.now().strftime("%Y-%m-%d")
    
    if len(sys.argv) > 2:
        guests_count = int(sys.argv[2])
    else:
        guests_count = 2
    
    if len(sys.argv) > 3:
        token = sys.argv[3]
    
    print(f"Запрос к API:")
    print(f"  Дата: {reserve_date}")
    print(f"  Количество гостей: {guests_count}")
    print(f"  Токен: {token[:20]}...")
    print()
    
    tables, full_response = get_tables_from_api(reserve_date, guests_count, token)
    
    if not tables:
        print("Столы не найдены в ответе API.")
        print("\nПолный ответ API:")
        print(json.dumps(full_response, indent=2, ensure_ascii=False))
        sys.exit(1)
    
    # Выводим результат
    print(f"Найдено столов: {len(tables)}\n")
    print(json.dumps(tables, indent=2, ensure_ascii=False))
    
    # Сохраняем в файл
    output_file = "tables-api-extract.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tables, f, indent=2, ensure_ascii=False)
    
    print(f"\nДанные также сохранены в {output_file}")


if __name__ == "__main__":
    main()



