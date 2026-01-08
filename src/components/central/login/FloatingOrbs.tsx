const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large cyan orb - top right */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 animate-float-slow"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.4), rgba(34, 211, 238, 0.1) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Medium indigo orb - left center */}
      <div 
        className="absolute top-1/3 -left-24 w-72 h-72 rounded-full opacity-40 animate-float-medium"
        style={{
          background: 'radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.5), rgba(99, 102, 241, 0.1) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      
      {/* Small purple orb - bottom center */}
      <div 
        className="absolute bottom-20 left-1/3 w-48 h-48 rounded-full opacity-35 animate-float-fast"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.1) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* Tiny blue orb - right center */}
      <div 
        className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-50 animate-float-medium"
        style={{
          background: 'radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.1) 50%, transparent 70%)',
          filter: 'blur(30px)',
          animationDelay: '2s',
        }}
      />

      {/* Extra glow at bottom */}
      <div 
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-40 opacity-20"
        style={{
          background: 'linear-gradient(to top, rgba(34, 211, 238, 0.3), transparent)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
};

export default FloatingOrbs;
