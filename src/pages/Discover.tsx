import { Compass, Sparkles, Zap, Globe, BookOpen, Music } from 'lucide-react';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { Link } from 'react-router-dom';

const categories = [
  { 
    icon: Sparkles, 
    title: 'Creative Writing', 
    description: 'Generate stories, poems, and creative content',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    icon: Zap, 
    title: 'Productivity', 
    description: 'Get help with tasks, planning, and organization',
    color: 'from-yellow-500 to-orange-500'
  },
  { 
    icon: Globe, 
    title: 'Research', 
    description: 'Explore topics and get detailed information',
    color: 'from-primary to-accent'
  },
  { 
    icon: BookOpen, 
    title: 'Learning', 
    description: 'Learn new skills and concepts interactively',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    icon: Music, 
    title: 'Entertainment', 
    description: 'Fun conversations, games, and trivia',
    color: 'from-rose-500 to-red-500'
  },
];

const Discover = () => {
  return (
    <div className="relative flex-1 h-screen flex flex-col">
      <BackgroundEffects />

      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Compass size={22} className="text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-light text-foreground">Discover</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Explore different ways to use Ombrion AI
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.title}
                  to="/"
                  className="glass rounded-xl p-6 hover:border-primary/30 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </Link>
              );
            })}
          </div>

          {/* Tips Section */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-medium text-foreground mb-4">Tips for better results</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm flex-shrink-0">1</span>
                <span>Be specific about what you need - the more context, the better the response</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm flex-shrink-0">2</span>
                <span>Ask follow-up questions to dive deeper into topics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm flex-shrink-0">3</span>
                <span>Use Spaces to organize conversations by project or topic</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;
