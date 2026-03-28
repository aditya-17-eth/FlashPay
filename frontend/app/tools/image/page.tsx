import { ImageTool } from "@/components/tools/ImageTool";
import { Image } from "lucide-react";

export default function ImagePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex flex-col items-center text-center">
         <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-4 border border-pink-500/20">
            <Image size={32} className="text-pink-400" />
         </div>
         <h1 className="text-4xl font-bold mb-2">Image Generator</h1>
         <p className="text-gray-400">Generate high quality images from text prompts.</p>
      </div>
      <ImageTool />
    </div>
  );
}
