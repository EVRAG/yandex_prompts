import React from 'react';

const imgImage2 = "https://www.figma.com/api/mcp/asset/e21f90de-7dc8-4926-9b95-0556756aa85e";
const imgImage1 = "https://www.figma.com/api/mcp/asset/7f85a3dc-d423-4ac6-9b72-f83b5425ce97";
const imgVector234256007 = "https://www.figma.com/api/mcp/asset/0c8bf050-a440-4cfe-85ef-d709293daaa4";
const imgVector234256015 = "https://www.figma.com/api/mcp/asset/862b6853-af5e-42b7-bf85-20d359850ed8";
const imgVector234256008 = "https://www.figma.com/api/mcp/asset/ff272ed8-f0f0-4609-b3ec-2ecf61642220";
const imgVector234256009 = "https://www.figma.com/api/mcp/asset/a2635c71-714d-4d7a-afac-6b53e8cea138";
const imgVector234256010 = "https://www.figma.com/api/mcp/asset/3ebf8230-5b32-4dc0-a4b3-b0b0295f8021";
const imgVector234256011 = "https://www.figma.com/api/mcp/asset/419af799-0f09-4f68-a869-34a9123a917b";
const imgVector234256012 = "https://www.figma.com/api/mcp/asset/55331509-5812-475c-9424-d4b101b685ec";
const imgVector234256013 = "https://www.figma.com/api/mcp/asset/2570c37f-8d49-4a6d-bf97-2fd92c75af0b";
const imgVector234256014 = "https://www.figma.com/api/mcp/asset/978f14f7-d78a-4191-96d7-76b2730a2f77";
const imgUnion = "https://www.figma.com/api/mcp/asset/f0d061c7-1d90-4e17-a01e-1237d35581e5";
const img = "https://www.figma.com/api/mcp/asset/1ff832f9-8080-4801-91ab-77aee14e7d1b";
const img1 = "https://www.figma.com/api/mcp/asset/4ed18eb1-55a1-4a68-a055-1afc75cb3eef";

interface PlayerBackgroundProps {
  children: React.ReactNode;
}

export default function PlayerBackground({ children }: PlayerBackgroundProps) {
  return (
    <div className="bg-[#080710] w-full min-h-screen overflow-hidden flex justify-center">
      <div className="relative w-full max-w-[375px] min-h-screen flex flex-col">
        
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute left-[-188px] top-[-183px]">
             <div className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[633px] h-[971px] opacity-50">
                <img src={imgImage2} alt="" className="w-full h-full object-cover" style={{ maskImage: `url(${imgImage1})`, WebkitMaskImage: `url(${imgImage1})` }} />
             </div>
          </div>

           {/* Decorative Vectors */}
          <div className="absolute top-[202px] left-[191px] w-[190px] h-[333px]">
             <img src={imgVector234256007} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[202px] left-[191px] w-[190px] h-[318px]">
             <img src={imgVector234256015} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[192px] left-[5px] w-[181px] h-[638px]">
             <img src={imgVector234256008} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[192px] left-[-15px] w-[202px] h-[128px]">
             <img src={imgVector234256009} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[194px] left-[187px] w-[206px] h-[53px]">
             <img src={imgVector234256010} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[85px] left-[187px] w-[193px] h-[108px]">
             <img src={imgVector234256011} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[-4px] left-[187px] w-[42px] h-[198px]">
             <img src={imgVector234256012} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[-12px] left-[8px] w-[179px] h-[206px]">
             <img src={imgVector234256013} alt="" className="w-full h-full" />
          </div>
           <div className="absolute top-[125px] left-[-12px] w-[199px] h-[68px]">
             <img src={imgVector234256014} alt="" className="w-full h-full" />
          </div>
           
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[322px] h-[312px] rotate-[150deg]">
             <img src={imgUnion} alt="" className="w-full h-full" />
           </div>
        </div>

        {/* Logo */}
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[212px] h-[50px] flex justify-center items-center pointer-events-none z-10 opacity-80 scale-75">
           <div className="relative w-[42px] h-[42px]">
              <div className="absolute inset-0 flex items-center justify-center">
                 <img src={img} alt="S" className="w-full h-full" />
              </div>
           </div>
           <div className="ml-2">
             <img src={img1} alt="Prompthub" className="h-auto w-auto" />
           </div>
        </div>

        {/* Content Container */}
        <div className="relative z-20 w-full flex-1 flex flex-col px-6 pt-32 pb-8">
          {children}
        </div>

      </div>
    </div>
  );
}
