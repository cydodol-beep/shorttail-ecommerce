import { BookOpen, Gamepad2, Zap, Trophy } from 'lucide-react';

export default function GameDescription() {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-[#3D2C1E] mb-4 flex items-center gap-2">
            <Gamepad2 className="text-[#C08261]" size={32} />
            Paws & Paths
          </h1>
          <p className="text-[#634832] mb-4 text-lg">
            Join your furry friend on an exciting adventure through various terrains! Jump over obstacles, collect treats, and earn points to unlock new dog breeds.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-[#E6D5B8] p-4 rounded-xl border-2 border-[#C08261]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-[#C08261]" size={20} />
                <h3 className="font-bold text-[#3D2C1E]">How to Play</h3>
              </div>
              <ul className="text-sm text-[#634832] space-y-1">
                <li>• Press <strong>SPACE</strong> or <strong>UP ARROW</strong> to jump</li>
                <li>• Avoid obstacles (cats, mailmen, puddles)</li>
                <li>• Collect bone treats for points</li>
                <li>• Build combos to multiply your points!</li>
              </ul>
            </div>
            
            <div className="bg-[#E6D5B8] p-4 rounded-xl border-2 border-[#C08261]">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-[#C08261]" size={20} />
                <h3 className="font-bold text-[#3D2C1E]">Scoring</h3>
              </div>
              <ul className="text-sm text-[#634832] space-y-1">
                <li>• Each treat = 10 points</li>
                <li>• Combos multiply your score</li>
                <li>• 5+ treats = 2x points</li>
                <li>• 10+ treats = 3x points and more!</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/3 flex flex-col items-center justify-center">
          <div className="bg-[#F4EBD9] p-4 rounded-xl border-4 border-[#C08261] text-center">
            <BookOpen className="mx-auto text-[#C08261]" size={48} />
            <h3 className="font-bold text-[#3D2C1E] mt-2">Compete with Others</h3>
            <p className="text-sm text-[#634832] mt-1">
              Check the leaderboard to see how your score compares to other players!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}