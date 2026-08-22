import { Link } from "react-router-dom";
import { Swords } from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex flex-col items-center text-center gap-8 mt-16 animate-fade-in">
      <div>
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-gradient">MLBB PLAY</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Монголын Mobile Legends: Bang Bang тоглогчдод зориулсан өрсөлдөөнт
          платформ — шударга ELO зэрэглэл, чанартай matchmaking, тэмцээнүүд.
        </p>
      </div>

      <Link to="/matchmaking" className="cyber-button flex items-center gap-2 animate-pulse-glow">
        <Swords size={20} />
        Тоглолт хайх
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
        <div className="cyber-card p-6">
          <div className="text-2xl font-bold text-cyber-purple">Шударга ELO</div>
          <p className="text-sm text-gray-400 mt-2">
            Тоглолт бүрийн дүнг MVP оноо, KDA-г тооцсон динамик томъёогоор
            бодно.
          </p>
        </div>
        <div className="cyber-card p-6">
          <div className="text-2xl font-bold text-cyber-cyan">Хурдан тоглолт</div>
          <p className="text-sm text-gray-400 mt-2">
            ELO мужаараа тохирсон өрсөлдөгчидтэй секундын дотор холбогдоно.
          </p>
        </div>
        <div className="cyber-card p-6">
          <div className="text-2xl font-bold text-cyber-pink">Тэмцээнүүд</div>
          <p className="text-sm text-gray-400 mt-2">
            Bracket-тэй эсэн тэмцээнд өрсөлдөж, клубынхаа нэрийг өргөмжлөөрэй.
          </p>
        </div>
      </div>
    </div>
  );
}
