export type InterestSeedNode = {
  name: string;
  slug: string;
  children?: InterestSeedNode[];
};

export const INTEREST_TAXONOMY: InterestSeedNode[] = [
  {
    name: 'Music',
    slug: 'music',
    children: [
      {
        name: 'Live Music',
        slug: 'live-music',
        children: [
          { name: 'Jazz', slug: 'jazz' },
          { name: 'Afrobeats', slug: 'afrobeats' },
          { name: 'Amapiano', slug: 'amapiano' },
          { name: 'Gospel', slug: 'gospel' },
          { name: 'Karaoke', slug: 'karaoke' },
          { name: 'Open Mic', slug: 'open-mic' },
        ],
      },
      {
        name: 'DJ & Dance Culture',
        slug: 'dj-dance-culture',
        children: [
          { name: 'DJ Sets', slug: 'dj-sets' },
          { name: 'House Music', slug: 'house-music' },
          { name: 'Hip Hop Nights', slug: 'hip-hop-nights' },
          { name: 'Reggae', slug: 'reggae' },
          { name: 'Silent Disco', slug: 'silent-disco' },
        ],
      },
      {
        name: 'Music Creation',
        slug: 'music-creation',
        children: [
          { name: 'Songwriting', slug: 'songwriting' },
          { name: 'Beat Making', slug: 'beat-making' },
          { name: 'Choirs', slug: 'choirs' },
          { name: 'Instrument Jams', slug: 'instrument-jams' },
        ],
      },
    ],
  },
  {
    name: 'Food & Dining',
    slug: 'food-dining',
    children: [
      {
        name: 'Cuisine',
        slug: 'cuisine',
        children: [
          { name: 'Kenyan Food', slug: 'kenyan-food' },
          { name: 'Ethiopian Food', slug: 'ethiopian-food' },
          { name: 'Italian Food', slug: 'italian-food' },
          { name: 'Indian Food', slug: 'indian-food' },
          { name: 'Asian Fusion', slug: 'asian-fusion' },
        ],
      },
      {
        name: 'Experiences',
        slug: 'food-experiences',
        children: [
          { name: 'Brunch', slug: 'brunch' },
          { name: 'Coffee Tastings', slug: 'coffee-tastings' },
          { name: 'Food Festivals', slug: 'food-festivals' },
          { name: 'Cooking Classes', slug: 'cooking-classes' },
          { name: 'Wine Tastings', slug: 'wine-tastings' },
        ],
      },
      {
        name: 'Casual Socials',
        slug: 'casual-socials',
        children: [
          { name: 'Street Food', slug: 'street-food' },
          { name: 'Dessert Hops', slug: 'dessert-hops' },
          { name: 'Dinner Parties', slug: 'dinner-parties' },
          { name: 'Picnic Dining', slug: 'picnic-dining' },
        ],
      },
    ],
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    children: [
      {
        name: 'Team Sports',
        slug: 'team-sports',
        children: [
          { name: 'Football', slug: 'football' },
          { name: 'Basketball', slug: 'basketball' },
          { name: 'Volleyball', slug: 'volleyball' },
          { name: 'Rugby', slug: 'rugby' },
        ],
      },
      {
        name: 'Training & Movement',
        slug: 'training-movement',
        children: [
          { name: 'Gym Workouts', slug: 'gym-workouts' },
          { name: 'Bootcamps', slug: 'bootcamps' },
          { name: 'Yoga', slug: 'yoga' },
          { name: 'Pilates', slug: 'pilates' },
          { name: 'Running Clubs', slug: 'running-clubs' },
        ],
      },
      {
        name: 'Adventure Fitness',
        slug: 'adventure-fitness',
        children: [
          { name: 'Hiking', slug: 'hiking' },
          { name: 'Cycling', slug: 'cycling' },
          { name: 'Rock Climbing', slug: 'rock-climbing' },
          { name: 'Trail Running', slug: 'trail-running' },
        ],
      },
    ],
  },
  {
    name: 'Arts & Creativity',
    slug: 'arts-creativity',
    children: [
      {
        name: 'Visual Arts',
        slug: 'visual-arts',
        children: [
          { name: 'Painting', slug: 'painting' },
          { name: 'Photography', slug: 'photography' },
          { name: 'Illustration', slug: 'illustration' },
          { name: 'Sculpture', slug: 'sculpture' },
        ],
      },
      {
        name: 'Creative Workshops',
        slug: 'creative-workshops',
        children: [
          { name: 'Pottery', slug: 'pottery' },
          { name: 'DIY Crafts', slug: 'diy-crafts' },
          { name: 'Calligraphy', slug: 'calligraphy' },
          { name: 'Fashion Design', slug: 'fashion-design' },
        ],
      },
      {
        name: 'Performing Arts',
        slug: 'performing-arts',
        children: [
          { name: 'Theatre', slug: 'theatre' },
          { name: 'Comedy', slug: 'comedy' },
          { name: 'Dance', slug: 'dance' },
          { name: 'Spoken Word', slug: 'spoken-word' },
        ],
      },
    ],
  },
  {
    name: 'Technology',
    slug: 'technology',
    children: [
      {
        name: 'Software Development',
        slug: 'software-development',
        children: [
          { name: 'Web Development', slug: 'web-development' },
          { name: 'Mobile Development', slug: 'mobile-development' },
          { name: 'Open Source', slug: 'open-source' },
          { name: 'Product Engineering', slug: 'product-engineering' },
        ],
      },
      {
        name: 'AI & Data',
        slug: 'ai-data',
        children: [
          { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
          { name: 'Machine Learning', slug: 'machine-learning' },
          { name: 'Data Science', slug: 'data-science' },
          { name: 'Analytics', slug: 'analytics' },
        ],
      },
      {
        name: 'Startup & Product',
        slug: 'startup-product',
        children: [
          { name: 'Founder Meetups', slug: 'founder-meetups' },
          { name: 'Tech Networking', slug: 'tech-networking' },
          { name: 'Product Management', slug: 'product-management' },
          { name: 'Hackathons', slug: 'hackathons' },
        ],
      },
    ],
  },
  {
    name: 'Learning',
    slug: 'learning',
    children: [
      {
        name: 'Professional Growth',
        slug: 'professional-growth',
        children: [
          { name: 'Career Talks', slug: 'career-talks' },
          { name: 'Public Speaking', slug: 'public-speaking' },
          { name: 'Leadership', slug: 'leadership' },
          { name: 'Mentorship', slug: 'mentorship' },
        ],
      },
      {
        name: 'Academic & Skills',
        slug: 'academic-skills',
        children: [
          { name: 'Book Clubs', slug: 'book-clubs' },
          { name: 'Language Exchange', slug: 'language-exchange' },
          { name: 'Writing Workshops', slug: 'writing-workshops' },
          { name: 'Debates', slug: 'debates' },
        ],
      },
      {
        name: 'Hands-On Classes',
        slug: 'hands-on-classes',
        children: [
          { name: 'Masterclasses', slug: 'masterclasses' },
          { name: 'Maker Labs', slug: 'maker-labs' },
          { name: 'Skill Swaps', slug: 'skill-swaps' },
          { name: 'Study Sessions', slug: 'study-sessions' },
        ],
      },
    ],
  },
  {
    name: 'Movies & Media',
    slug: 'movies-media',
    children: [
      {
        name: 'Screenings',
        slug: 'screenings',
        children: [
          { name: 'Cinema Nights', slug: 'cinema-nights' },
          { name: 'Documentaries', slug: 'documentaries' },
          { name: 'Short Films', slug: 'short-films' },
          { name: 'Outdoor Movies', slug: 'outdoor-movies' },
        ],
      },
      {
        name: 'Fan Culture',
        slug: 'fan-culture',
        children: [
          { name: 'Series Watch Parties', slug: 'series-watch-parties' },
          { name: 'Anime Screenings', slug: 'anime-screenings' },
          { name: 'Pop Culture Trivia', slug: 'pop-culture-trivia' },
          { name: 'Fandom Meetups', slug: 'fandom-meetups' },
        ],
      },
      {
        name: 'Media Creation',
        slug: 'media-creation',
        children: [
          { name: 'Podcasting', slug: 'podcasting' },
          { name: 'Content Creation', slug: 'content-creation' },
          { name: 'Filmmaking', slug: 'filmmaking' },
          { name: 'Video Editing', slug: 'video-editing' },
        ],
      },
    ],
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    children: [
      {
        name: 'Video Games',
        slug: 'video-games',
        children: [
          { name: 'Console Gaming', slug: 'console-gaming' },
          { name: 'PC Gaming', slug: 'pc-gaming' },
          { name: 'Mobile Gaming', slug: 'mobile-gaming' },
          { name: 'Esports', slug: 'esports' },
        ],
      },
      {
        name: 'Social Gaming',
        slug: 'social-gaming',
        children: [
          { name: 'Board Games', slug: 'board-games' },
          { name: 'Trivia Nights', slug: 'trivia-nights' },
          { name: 'Card Games', slug: 'card-games' },
          { name: 'Escape Rooms', slug: 'escape-rooms' },
        ],
      },
      {
        name: 'Creative Play',
        slug: 'creative-play',
        children: [
          { name: 'Game Dev Jams', slug: 'game-dev-jams' },
          { name: 'Cosplay', slug: 'cosplay' },
          { name: 'Tabletop RPGs', slug: 'tabletop-rpgs' },
          { name: 'Retro Gaming', slug: 'retro-gaming' },
        ],
      },
    ],
  },
  {
    name: 'Travel & Exploration',
    slug: 'travel-exploration',
    children: [
      {
        name: 'City Discovery',
        slug: 'city-discovery',
        children: [
          { name: 'City Tours', slug: 'city-tours' },
          { name: 'Hidden Gems', slug: 'hidden-gems' },
          { name: 'Cultural Walks', slug: 'cultural-walks' },
          { name: 'Photo Walks', slug: 'photo-walks' },
        ],
      },
      {
        name: 'Weekend Trips',
        slug: 'weekend-trips',
        children: [
          { name: 'Road Trips', slug: 'road-trips' },
          { name: 'Staycations', slug: 'staycations' },
          { name: 'Camping Trips', slug: 'camping-trips' },
          { name: 'Day Escapes', slug: 'day-escapes' },
        ],
      },
      {
        name: 'Outdoor Discovery',
        slug: 'outdoor-discovery',
        children: [
          { name: 'Safari Experiences', slug: 'safari-experiences' },
          { name: 'Waterfalls', slug: 'waterfalls' },
          { name: 'Nature Walks', slug: 'nature-walks' },
          { name: 'Scenic Drives', slug: 'scenic-drives' },
        ],
      },
    ],
  },
  {
    name: 'Social & Community',
    slug: 'social-community',
    children: [
      {
        name: 'Meetups',
        slug: 'meetups',
        children: [
          { name: 'Social Mixers', slug: 'social-mixers' },
          { name: 'Networking Events', slug: 'networking-events' },
          { name: 'Friendship Circles', slug: 'friendship-circles' },
          { name: 'Community Hangouts', slug: 'community-hangouts' },
        ],
      },
      {
        name: 'Impact',
        slug: 'impact',
        children: [
          { name: 'Volunteering', slug: 'volunteering' },
          { name: 'Fundraisers', slug: 'fundraisers' },
          { name: 'Civic Action', slug: 'civic-action' },
          { name: 'Neighborhood Cleanups', slug: 'neighborhood-cleanups' },
        ],
      },
      {
        name: 'Identity & Support',
        slug: 'identity-support',
        children: [
          { name: 'Women Communities', slug: 'women-communities' },
          { name: 'Men Support Groups', slug: 'men-support-groups' },
          { name: 'Diaspora Meetups', slug: 'diaspora-meetups' },
          { name: 'Faith Groups', slug: 'faith-groups' },
        ],
      },
    ],
  },
  {
    name: 'Lifestyle & Wellness',
    slug: 'lifestyle-wellness',
    children: [
      {
        name: 'Mind & Body',
        slug: 'mind-body',
        children: [
          { name: 'Meditation', slug: 'meditation' },
          { name: 'Breathwork', slug: 'breathwork' },
          { name: 'Sound Healing', slug: 'sound-healing' },
          { name: 'Mindfulness', slug: 'mindfulness' },
        ],
      },
      {
        name: 'Self Care',
        slug: 'self-care',
        children: [
          { name: 'Spa Days', slug: 'spa-days' },
          { name: 'Skincare', slug: 'skincare' },
          { name: 'Journaling', slug: 'journaling' },
          { name: 'Healthy Habits', slug: 'healthy-habits' },
        ],
      },
      {
        name: 'Wellness Community',
        slug: 'wellness-community',
        children: [
          { name: 'Walking Clubs', slug: 'walking-clubs' },
          { name: 'Wellness Retreats', slug: 'wellness-retreats' },
          { name: 'Sobriety Socials', slug: 'sobriety-socials' },
          { name: 'Support Circles', slug: 'support-circles' },
        ],
      },
    ],
  },
  {
    name: 'Nightlife',
    slug: 'nightlife',
    children: [
      {
        name: 'Going Out',
        slug: 'going-out',
        children: [
          { name: 'Club Nights', slug: 'club-nights' },
          { name: 'Bar Crawls', slug: 'bar-crawls' },
          { name: 'Cocktail Lounges', slug: 'cocktail-lounges' },
          { name: 'Rooftop Parties', slug: 'rooftop-parties' },
        ],
      },
      {
        name: 'Late Night Socials',
        slug: 'late-night-socials',
        children: [
          { name: 'After Parties', slug: 'after-parties' },
          { name: 'Late Night Eats', slug: 'late-night-eats' },
          { name: 'Night Drives', slug: 'night-drives' },
          { name: 'Live DJ Nights', slug: 'live-dj-nights' },
        ],
      },
      {
        name: 'Alternative Nights',
        slug: 'alternative-nights',
        children: [
          { name: 'Poetry Nights', slug: 'poetry-nights' },
          { name: 'Comedy Nights', slug: 'comedy-nights' },
          { name: 'Game Nights', slug: 'game-nights' },
          { name: 'Late Museums', slug: 'late-museums' },
        ],
      },
    ],
  },
  {
    name: 'Relationships & Dating',
    slug: 'relationships-dating',
    children: [
      {
        name: 'Dating Experiences',
        slug: 'dating-experiences',
        children: [
          { name: 'Speed Dating', slug: 'speed-dating' },
          { name: 'Singles Mixers', slug: 'singles-mixers' },
          { name: 'Romantic Dinners', slug: 'romantic-dinners' },
          { name: 'Date Night Ideas', slug: 'date-night-ideas' },
        ],
      },
      {
        name: 'Connection Building',
        slug: 'connection-building',
        children: [
          { name: 'Relationship Talks', slug: 'relationship-talks' },
          { name: 'Couples Activities', slug: 'couples-activities' },
          { name: 'Love Languages', slug: 'love-languages' },
          { name: 'Intentional Dating', slug: 'intentional-dating' },
        ],
      },
      {
        name: 'Social Confidence',
        slug: 'social-confidence',
        children: [
          { name: 'Confidence Workshops', slug: 'confidence-workshops' },
          { name: 'Flirting Basics', slug: 'flirting-basics' },
          { name: 'Conversation Skills', slug: 'conversation-skills' },
          { name: 'Personal Style', slug: 'personal-style' },
        ],
      },
    ],
  },
  {
    name: 'Family & Parenting',
    slug: 'family-parenting',
    children: [
      {
        name: 'Family Time',
        slug: 'family-time',
        children: [
          { name: 'Kids Activities', slug: 'kids-activities' },
          { name: 'Family Picnics', slug: 'family-picnics' },
          { name: 'Play Dates', slug: 'play-dates' },
          { name: 'Story Time', slug: 'story-time' },
        ],
      },
      {
        name: 'Parenting Support',
        slug: 'parenting-support',
        children: [
          { name: 'Parent Circles', slug: 'parent-circles' },
          { name: 'New Moms', slug: 'new-moms' },
          { name: 'Dad Meetups', slug: 'dad-meetups' },
          { name: 'Parenting Workshops', slug: 'parenting-workshops' },
        ],
      },
      {
        name: 'Education & Growth',
        slug: 'education-growth',
        children: [
          { name: 'STEM for Kids', slug: 'stem-for-kids' },
          { name: 'Arts for Kids', slug: 'arts-for-kids' },
          { name: 'Teen Activities', slug: 'teen-activities' },
          { name: 'School Community', slug: 'school-community' },
        ],
      },
    ],
  },
  {
    name: 'Pets & Animals',
    slug: 'pets-animals',
    children: [
      {
        name: 'Pet Socials',
        slug: 'pet-socials',
        children: [
          { name: 'Dog Walks', slug: 'dog-walks' },
          { name: 'Pet Playdates', slug: 'pet-playdates' },
          { name: 'Pet Friendly Cafes', slug: 'pet-friendly-cafes' },
          { name: 'Cat Communities', slug: 'cat-communities' },
        ],
      },
      {
        name: 'Animal Welfare',
        slug: 'animal-welfare',
        children: [
          { name: 'Pet Adoption', slug: 'pet-adoption' },
          { name: 'Rescue Volunteering', slug: 'rescue-volunteering' },
          { name: 'Wildlife Conservation', slug: 'wildlife-conservation' },
          { name: 'Animal Fundraisers', slug: 'animal-fundraisers' },
        ],
      },
      {
        name: 'Nature & Wildlife',
        slug: 'nature-wildlife',
        children: [
          { name: 'Birdwatching', slug: 'birdwatching' },
          { name: 'Horse Riding', slug: 'horse-riding' },
          { name: 'Nature Photography', slug: 'nature-photography' },
          { name: 'Safari Walks', slug: 'safari-walks' },
        ],
      },
    ],
  },
  {
    name: 'Environment & Causes',
    slug: 'environment-causes',
    children: [
      {
        name: 'Climate & Sustainability',
        slug: 'climate-sustainability',
        children: [
          { name: 'Climate Action', slug: 'climate-action' },
          { name: 'Recycling', slug: 'recycling' },
          { name: 'Sustainable Living', slug: 'sustainable-living' },
          { name: 'Eco Markets', slug: 'eco-markets' },
        ],
      },
      {
        name: 'Community Impact',
        slug: 'community-impact',
        children: [
          { name: 'Charity Drives', slug: 'charity-drives' },
          { name: 'Food Banks', slug: 'food-banks' },
          { name: 'Youth Mentoring', slug: 'youth-mentoring' },
          { name: 'Community Service', slug: 'community-service' },
        ],
      },
      {
        name: 'Advocacy',
        slug: 'advocacy',
        children: [
          { name: 'Policy Dialogues', slug: 'policy-dialogues' },
          { name: 'Activism', slug: 'activism' },
          { name: 'Awareness Campaigns', slug: 'awareness-campaigns' },
          { name: 'Social Justice', slug: 'social-justice' },
        ],
      },
    ],
  },
  {
    name: 'Fashion & Beauty',
    slug: 'fashion-beauty',
    children: [
      {
        name: 'Style Culture',
        slug: 'style-culture',
        children: [
          { name: 'Streetwear', slug: 'streetwear' },
          { name: 'Luxury Fashion', slug: 'luxury-fashion' },
          { name: 'Thrifting', slug: 'thrifting' },
          { name: 'Fashion Shows', slug: 'fashion-shows' },
        ],
      },
      {
        name: 'Beauty',
        slug: 'beauty',
        children: [
          { name: 'Makeup Artistry', slug: 'makeup-artistry' },
          { name: 'Hair Styling', slug: 'hair-styling' },
          { name: 'Skincare Events', slug: 'skincare-events' },
          { name: 'Fragrance', slug: 'fragrance' },
        ],
      },
      {
        name: 'Creative Expression',
        slug: 'style-expression',
        children: [
          { name: 'Personal Styling', slug: 'personal-styling' },
          { name: 'Fashion Photography', slug: 'fashion-photography' },
          { name: 'Designer Markets', slug: 'designer-markets' },
          { name: 'Sneaker Culture', slug: 'sneaker-culture' },
        ],
      },
    ],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    children: [
      {
        name: 'Car Culture',
        slug: 'car-culture',
        children: [
          { name: 'Car Meets', slug: 'car-meets' },
          { name: 'Off-Roading', slug: 'off-roading' },
          { name: 'Drift Events', slug: 'drift-events' },
          { name: 'Classic Cars', slug: 'classic-cars' },
        ],
      },
      {
        name: 'Motorcycles',
        slug: 'motorcycles',
        children: [
          { name: 'Biker Meetups', slug: 'biker-meetups' },
          { name: 'Ride Outs', slug: 'ride-outs' },
          { name: 'Adventure Bikes', slug: 'adventure-bikes' },
          { name: 'Moto Training', slug: 'moto-training' },
        ],
      },
      {
        name: 'Auto Lifestyle',
        slug: 'auto-lifestyle',
        children: [
          { name: 'Road Safety', slug: 'road-safety' },
          { name: 'Mechanic Workshops', slug: 'mechanic-workshops' },
          { name: 'Road Trips', slug: 'auto-road-trips' },
          { name: 'Motorsport Watch Parties', slug: 'motorsport-watch-parties' },
        ],
      },
    ],
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    children: [
      {
        name: 'Home Inspiration',
        slug: 'home-inspiration',
        children: [
          { name: 'Interior Design', slug: 'interior-design' },
          { name: 'Home Decor', slug: 'home-decor' },
          { name: 'Minimal Living', slug: 'minimal-living' },
          { name: 'Furniture Markets', slug: 'furniture-markets' },
        ],
      },
      {
        name: 'DIY & Gardening',
        slug: 'diy-gardening',
        children: [
          { name: 'Gardening', slug: 'gardening' },
          { name: 'Urban Farming', slug: 'urban-farming' },
          { name: 'DIY Projects', slug: 'diy-projects' },
          { name: 'Plant Swaps', slug: 'plant-swaps' },
        ],
      },
      {
        name: 'Hosting & Living Well',
        slug: 'hosting-living-well',
        children: [
          { name: 'Dinner Hosting', slug: 'dinner-hosting' },
          { name: 'Home Organization', slug: 'home-organization' },
          { name: 'Real Estate Talks', slug: 'real-estate-talks' },
          { name: 'Housewarming Socials', slug: 'housewarming-socials' },
        ],
      },
    ],
  },
  {
    name: 'Faith & Spirituality',
    slug: 'faith-spirituality',
    children: [
      {
        name: 'Faith Gatherings',
        slug: 'faith-gatherings',
        children: [
          { name: 'Church Communities', slug: 'church-communities' },
          { name: 'Bible Study', slug: 'bible-study' },
          { name: 'Prayer Nights', slug: 'prayer-nights' },
          { name: 'Gospel Concerts', slug: 'gospel-concerts' },
        ],
      },
      {
        name: 'Spiritual Practice',
        slug: 'spiritual-practice',
        children: [
          { name: 'Meditation Retreats', slug: 'meditation-retreats' },
          { name: 'Yoga Philosophy', slug: 'yoga-philosophy' },
          { name: 'Healing Circles', slug: 'healing-circles' },
          { name: 'Mindful Reflection', slug: 'mindful-reflection' },
        ],
      },
      {
        name: 'Purpose & Service',
        slug: 'purpose-service',
        children: [
          { name: 'Volunteer Missions', slug: 'volunteer-missions' },
          { name: 'Faith and Business', slug: 'faith-and-business' },
          { name: 'Young Adults Fellowship', slug: 'young-adults-fellowship' },
          { name: 'Service Projects', slug: 'service-projects' },
        ],
      },
    ],
  },
];

export const TAG_GROUPS = {
  intent: [
    'meet_new_people',
    'network_professionally',
    'explore_city',
    'learn_something_new',
    'stay_active',
    'have_fun_tonight',
    'relax_and_unwind',
    'go_on_a_date',
    'make_friends',
    'build_community',
  ],
  vibe: [
    'chill',
    'energetic',
    'classy',
    'adventurous',
    'creative',
    'romantic',
    'family_friendly',
    'professional',
    'spiritual',
    'youthful',
    'exclusive',
    'casual',
  ],
  audience: [
    'students',
    'professionals',
    'founders',
    'developers',
    'creatives',
    'parents',
    'singles',
    'couples',
    'families',
    'beginners',
    'experts',
    'women_only',
    'tourists',
    'locals',
  ],
  location: [
    'westlands',
    'kilimani',
    'cbd',
    'karen',
    'ruiru',
    'thika_road',
    'rooftop',
    'outdoors',
    'campus_area',
    'nature_spot',
    'riverside',
    'industrial_area',
  ],
  time: [
    'morning',
    'afternoon',
    'evening',
    'late_night',
    'weekday',
    'after_work',
    'weekend',
    'sunday_chill',
    'holiday',
  ],
  price: ['free', 'budget', 'mid_range', 'premium', 'luxury'],
} as const;
