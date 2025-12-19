import { BookOpen, Gamepad2, Zap, Trophy } from 'lucide-react';

export default function GameDescription() {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#3D2C1E] mb-4 flex items-center gap-2">
            <Gamepad2 className="text-[#C08261] w-6 h-6 sm:w-8 sm:h-8" />
            Paws & Paths
          </h1>
          <p className="text-[#634832] mb-4 text-base sm:text-lg">
            Join your furry friend on an exciting adventure through various terrains! Jump over obstacles, collect treats, and earn points to unlock new dog breeds.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-6">
            <div className="bg-[#E6D5B8] p-4 rounded-xl border-2 border-[#C08261]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-[#C08261] w-4 h-4 sm:w-5 sm:h-5" />
                <h3 className="font-bold text-[#3D2C1E] text-sm sm:text-base">How to Play</h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#634832] space-y-1">
                <li>• Press <strong>SPACE</strong> or <strong>UP ARROW</strong> to jump</li>
                <li>• Avoid obstacles (cats, mailmen, puddles)</li>
                <li>• Collect bone treats for points (3 points each)</li>
                <li>• Earn bonus points after collecting 5+ treats (+1 each)</li>
                <li>• Earn bigger bonus after collecting 10+ treats (+3 each)</li>
              </ul>
            </div>

            <div className="bg-[#E6D5B8] p-4 rounded-xl border-2 border-[#C08261]">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-[#C08261] w-4 h-4 sm:w-5 sm:h-5" />
                <h3 className="font-bold text-[#3D2C1E] text-sm sm:text-base">Scoring</h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#634832] space-y-1">
                <li>• Each treat = 3 base points</li>
                <li>• +1 bonus point per treat after 5 total treats collected</li>
                <li>• +3 bonus points per treat after 10 total treats collected</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/3 mt-4 md:mt-0 flex flex-col items-center justify-center">
          <div className="bg-[#F4EBD9] p-4 rounded-xl border-4 border-[#C08261] text-center w-full">
            <BookOpen className="mx-auto text-[#C08261] w-9 h-9 sm:w-12 sm:h-12" />
            <h3 className="font-bold text-[#3D2C1E] mt-2 text-sm sm:text-base">Enjoy the Adventure!</h3>
            <p className="text-xs sm:text-sm text-[#634832] mt-1">
              Jump, collect treats, and achieve high scores in this fun adventure!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}