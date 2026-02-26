// Mock data for the Team Monitoring App

export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'offline';
  todayTime: number; // in minutes
  productivity: number; // percentage
  avatar: string;
}

export interface ActivitySegment {
  time: string;
  status: 'active' | 'idle';
  duration: number; // in minutes
}

export interface Screenshot {
  id: string;
  userId: string;
  timestamp: Date;
  imageUrl: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    status: 'active',
    todayTime: 435,
    productivity: 87,
    avatar: 'SJ'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.c@company.com',
    status: 'active',
    todayTime: 398,
    productivity: 92,
    avatar: 'MC'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@company.com',
    status: 'offline',
    todayTime: 0,
    productivity: 0,
    avatar: 'ER'
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james.w@company.com',
    status: 'active',
    todayTime: 412,
    productivity: 78,
    avatar: 'JW'
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.a@company.com',
    status: 'active',
    todayTime: 456,
    productivity: 95,
    avatar: 'LA'
  },
  {
    id: '6',
    name: 'David Kim',
    email: 'david.k@company.com',
    status: 'offline',
    todayTime: 0,
    productivity: 0,
    avatar: 'DK'
  },
  {
    id: '7',
    name: 'Jessica Martinez',
    email: 'jessica.m@company.com',
    status: 'active',
    todayTime: 389,
    productivity: 84,
    avatar: 'JM'
  },
  {
    id: '8',
    name: 'Robert Taylor',
    email: 'robert.t@company.com',
    status: 'active',
    todayTime: 421,
    productivity: 89,
    avatar: 'RT'
  }
];

// Generate activity timeline for a user
export const generateActivityTimeline = (userId: string): ActivitySegment[] => {
  const timeline: ActivitySegment[] = [];
  const startHour = 9;
  const endHour = 17;
  
  for (let hour = startHour; hour < endHour; hour++) {
    const segments = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < segments; i++) {
      const minute = Math.floor(Math.random() * 60);
      const duration = Math.floor(Math.random() * 20) + 5;
      const status = Math.random() > 0.3 ? 'active' : 'idle';
      
      timeline.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        status,
        duration
      });
    }
  }
  
  return timeline.sort((a, b) => a.time.localeCompare(b.time));
};

// Generate mock screenshots for a user
export const generateScreenshots = (userId: string, days: number = 1): Screenshot[] => {
  const screenshots: Screenshot[] = [];
  const now = new Date();
  
  // Real Unsplash images for variety
  const screenshotImages = [
    'https://images.unsplash.com/photo-1567641091594-71640a68f847?w=800',
    'https://images.unsplash.com/photo-1623251606108-512c7c4a3507?w=800',
    'https://images.unsplash.com/photo-1649760052916-2286857f82d3?w=800',
    'https://images.unsplash.com/photo-1659449538037-41550dc1ec45?w=800',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800'
  ];
  
  for (let day = 0; day < days; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Generate screenshots for working hours (9 AM - 5 PM)
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timestamp = new Date(date);
        timestamp.setHours(hour, minute, 0, 0);
        
        // Don't generate future screenshots
        if (timestamp > now) continue;
        
        screenshots.push({
          id: `${userId}-${timestamp.getTime()}`,
          userId,
          timestamp,
          imageUrl: screenshotImages[Math.floor(Math.random() * screenshotImages.length)]
        });
      }
    }
  }
  
  return screenshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};