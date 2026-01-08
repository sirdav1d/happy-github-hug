import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Zap } from 'lucide-react';

const FloatingMetrics = () => {
  const metrics = [
    { icon: TrendingUp, value: '+47%', label: 'Crescimento', x: '10%', y: '20%', delay: 0 },
    { icon: Users, value: '2.4k', label: 'Usuários', x: '75%', y: '15%', delay: 0.5 },
    { icon: Target, value: '98%', label: 'Meta atingida', x: '15%', y: '70%', delay: 1 },
    { icon: Zap, value: '3.2x', label: 'ROI médio', x: '80%', y: '65%', delay: 1.5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ left: metric.x, top: metric.y }}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ 
            opacity: [0, 0.6, 0.6, 0],
            y: [20, 0, 0, -20],
            scale: [0.8, 1, 1, 0.9]
          }}
          transition={{
            duration: 8,
            delay: metric.delay,
            repeat: Infinity,
            repeatDelay: 4,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/40 backdrop-blur-sm border border-white/10">
            <metric.icon className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <p className="text-sm font-bold text-white">{metric.value}</p>
              <p className="text-[10px] text-slate-400">{metric.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingMetrics;
