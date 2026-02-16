import React from 'react';

const About: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-neutral-900/30 rounded-2xl border border-white/5">
        <div className="max-w-xl text-center">
            <h2 className="text-3xl font-display font-bold text-white mb-4">About Us</h2>
            <p className="text-neutral-400 leading-relaxed">
                The Quiz Buzzer System (QBS) is designed to provide fair, accurate, and millisecond-precise buzzer tracking for competitive events. Built with React and modern web technologies.
            </p>
        </div>
    </div>
  );
};

export default About;