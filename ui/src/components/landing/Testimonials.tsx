import React from 'react';
import { Card } from '../common/Card';
import { Star, Quote } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: 'Anjali Menon',
      role: 'IT Project Manager, Kochi',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      comment:
        'FluentAI helped me overcome my nervousness during client calls with US stakeholders. The instant Malayalam grammar explanations are absolute gold!',
      rating: 5,
    },
    {
      name: 'Vishnu Prasad',
      role: 'Software Engineer, Trivandrum',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      comment:
        'Practicing with the AI voice mentor every morning gave me the confidence to clear my international job interview in just 3 weeks!',
      rating: 5,
    },
    {
      name: 'Dr. Reshma Kurup',
      role: 'Medical Researcher, Kozhikode',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
      comment:
        'The pronunciation coach identified my Malayalam accent patterns and showed me exactly how to articulate silent English letters correctly.',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 relative" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 mb-3 border border-purple-200">
            Success Stories
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Loved by Learners Across <span className="gradient-text">Kerala</span>
          </h2>
          <p className="mt-3 text-slate-600 font-medium text-base">
            Read how FluentAI transformed speaking confidence for professionals and students alike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <Card key={idx} variant="glass" hoverEffect className="p-8 rounded-3xl flex flex-col justify-between relative border border-white/90">
              <Quote className="w-8 h-8 text-indigo-300/40 absolute top-6 right-6" />
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm md:text-base text-slate-700 leading-relaxed font-normal italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
                <img src={rev.image} alt={rev.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100" />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{rev.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{rev.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};
