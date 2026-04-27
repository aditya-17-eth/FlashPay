import { ImageTool } from "@/components/tools/ImageTool";
import { Image, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ImagePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl relative">
      <Link href="/" className="absolute top-8 left-4 md:left-0 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-900/50 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors w-fit border border-gray-800">
        <ArrowLeft size={16} /> Back
      </Link>
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
