const fs = require('fs');

// Читаем файл tables.json
const data = JSON.parse(fs.readFileSync('tables.json', 'utf8'));

// Извлекаем ID и number из каждого стола
const tablesInfo = Object.values(data.tables).map(table => ({
    id: table.id,
    number: table.number
}));

// Выводим результат
console.log(JSON.stringify(tablesInfo, null, 2));

// Также можно сохранить в файл
fs.writeFileSync('tables-id-number.json', JSON.stringify(tablesInfo, null, 2));
console.log('\nДанные также сохранены в tables-id-number.json');



