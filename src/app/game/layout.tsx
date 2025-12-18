import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paws & Paths - Game",
  description: "A fun side-scrolling dog adventure game",
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#E6D5B8] dark:bg-[#3D2C1E] py-8">
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
}