import { TriviaQuestion, TriviaCategory } from './types';

const questions: TriviaQuestion[] = [
  // Entertainment — harder
  { category: 'entertainment', question: 'What was Stanley Kubrick\'s final film?', choices: ['Full Metal Jacket', 'Eyes Wide Shut', 'A.I.', 'The Shining'], answer: 1 },
  { category: 'entertainment', question: 'Which actress has won the most Academy Awards?', choices: ['Meryl Streep', 'Katharine Hepburn', 'Cate Blanchett', 'Frances McDormand'], answer: 1 },
  { category: 'entertainment', question: 'What year did Spotify launch publicly?', choices: ['2006', '2008', '2010', '2012'], answer: 1 },
  { category: 'entertainment', question: 'Who composed the score for Interstellar?', choices: ['John Williams', 'Hans Zimmer', 'Danny Elfman', 'Howard Shore'], answer: 1 },
  { category: 'entertainment', question: 'What was the first animated film nominated for Best Picture?', choices: ['Toy Story', 'Beauty and the Beast', 'Up', 'Shrek'], answer: 1 },
  { category: 'entertainment', question: 'Which Beatles album features "Come Together"?', choices: ['Sgt. Pepper\'s', 'Abbey Road', 'Let It Be', 'White Album'], answer: 1 },
  { category: 'entertainment', question: 'What is the highest-rated show on IMDb (2024)?', choices: ['The Wire', 'Breaking Bad', 'The Sopranos', 'Planet Earth II'], answer: 1 },
  { category: 'entertainment', question: 'Who wrote the novel "Do Androids Dream of Electric Sheep?"', choices: ['Isaac Asimov', 'Philip K. Dick', 'Ray Bradbury', 'Arthur C. Clarke'], answer: 1 },
  { category: 'entertainment', question: 'What was Radiohead\'s third studio album?', choices: ['The Bends', 'OK Computer', 'Kid A', 'Amnesiac'], answer: 1 },
  { category: 'entertainment', question: 'Which director made "Mulholland Drive"?', choices: ['David Fincher', 'David Lynch', 'David Cronenberg', 'Darren Aronofsky'], answer: 1 },
  { category: 'entertainment', question: 'What year did the original PlayStation launch in Japan?', choices: ['1993', '1994', '1995', '1996'], answer: 1 },
  { category: 'entertainment', question: 'Who played the Joker in "The Dark Knight"?', choices: ['Jack Nicholson', 'Jared Leto', 'Heath Ledger', 'Joaquin Phoenix'], answer: 2 },

  // World — harder
  { category: 'world', question: 'What is the smallest country in mainland Africa?', choices: ['Eswatini', 'Gambia', 'Djibouti', 'Lesotho'], answer: 1 },
  { category: 'world', question: 'Which strait separates Europe from Africa?', choices: ['Bosporus', 'Gibraltar', 'Hormuz', 'Malacca'], answer: 1 },
  { category: 'world', question: 'What is the deepest point in the ocean?', choices: ['Puerto Rico Trench', 'Mariana Trench', 'Tonga Trench', 'Java Trench'], answer: 1 },
  { category: 'world', question: 'How many time zones does Russia span?', choices: ['9', '11', '13', '15'], answer: 1 },
  { category: 'world', question: 'What is the longest cave system in the world?', choices: ['Son Doong', 'Mammoth Cave', 'Jewel Cave', 'Sistema Sac Actun'], answer: 1 },
  { category: 'world', question: 'Which country has the most islands?', choices: ['Indonesia', 'Philippines', 'Sweden', 'Norway'], answer: 2 },
  { category: 'world', question: 'What is the driest inhabited continent?', choices: ['Africa', 'Asia', 'Australia', 'South America'], answer: 2 },
  { category: 'world', question: 'Which city is built on 14 islands?', choices: ['Venice', 'Stockholm', 'Amsterdam', 'Helsinki'], answer: 1 },
  { category: 'world', question: 'What percentage of Earth\'s water is freshwater?', choices: ['1%', '3%', '7%', '12%'], answer: 1 },
  { category: 'world', question: 'Which language has the most native speakers after Mandarin?', choices: ['English', 'Hindi', 'Spanish', 'Arabic'], answer: 2 },
  { category: 'world', question: 'What is the most visited country in the world?', choices: ['USA', 'Spain', 'France', 'China'], answer: 2 },
  { category: 'world', question: 'Which desert is the largest by area?', choices: ['Sahara', 'Arabian', 'Gobi', 'Antarctic'], answer: 3 },

  // History — harder
  { category: 'history', question: 'What treaty ended World War I?', choices: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Ghent', 'Treaty of Westphalia'], answer: 1 },
  { category: 'history', question: 'Who was the last pharaoh of ancient Egypt?', choices: ['Nefertiti', 'Hatshepsut', 'Cleopatra VII', 'Ramesses II'], answer: 2 },
  { category: 'history', question: 'In what year was the Magna Carta signed?', choices: ['1066', '1215', '1348', '1492'], answer: 1 },
  { category: 'history', question: 'Which civilization built Machu Picchu?', choices: ['Aztec', 'Maya', 'Inca', 'Olmec'], answer: 2 },
  { category: 'history', question: 'What was the Byzantine Empire\'s capital?', choices: ['Rome', 'Athens', 'Constantinople', 'Alexandria'], answer: 2 },
  { category: 'history', question: 'Who led the Mongol Empire at its peak?', choices: ['Genghis Khan', 'Kublai Khan', 'Tamerlane', 'Attila'], answer: 0 },
  { category: 'history', question: 'What year did the Soviet Union dissolve?', choices: ['1989', '1990', '1991', '1993'], answer: 2 },
  { category: 'history', question: 'Which war was fought between 1950-1953?', choices: ['Vietnam', 'Korean', 'Suez', 'Falklands'], answer: 1 },
  { category: 'history', question: 'Who assassinated Archduke Franz Ferdinand?', choices: ['Leon Czolgosz', 'Gavrilo Princip', 'Lee Harvey Oswald', 'John Wilkes Booth'], answer: 1 },
  { category: 'history', question: 'What was the first civilization to use writing?', choices: ['Egyptian', 'Chinese', 'Sumerian', 'Indus Valley'], answer: 2 },
  { category: 'history', question: 'Which emperor divided the Roman Empire into East and West?', choices: ['Constantine', 'Augustus', 'Diocletian', 'Nero'], answer: 2 },
  { category: 'history', question: 'What year did the Chernobyl disaster occur?', choices: ['1984', '1986', '1988', '1990'], answer: 1 },

  // Sports — harder
  { category: 'sports', question: 'What is the only Grand Slam played on clay?', choices: ['Wimbledon', 'US Open', 'French Open', 'Australian Open'], answer: 2 },
  { category: 'sports', question: 'How many dimples does a regulation golf ball have?', choices: ['252', '336', '392', '450'], answer: 1 },
  { category: 'sports', question: 'Which country invented badminton?', choices: ['China', 'India', 'England', 'Japan'], answer: 1 },
  { category: 'sports', question: 'What is the length of an Olympic swimming pool in meters?', choices: ['25', '50', '75', '100'], answer: 1 },
  { category: 'sports', question: 'Who has the most career hat tricks in NHL history?', choices: ['Gretzky', 'Lemieux', 'Ovechkin', 'Howe'], answer: 0 },
  { category: 'sports', question: 'What year did women first compete in the Olympics?', choices: ['1896', '1900', '1908', '1920'], answer: 1 },
  { category: 'sports', question: 'How long is a marathon in miles?', choices: ['24.2', '25.2', '26.2', '27.2'], answer: 2 },
  { category: 'sports', question: 'Which country has won the most Cricket World Cups?', choices: ['India', 'Australia', 'West Indies', 'England'], answer: 1 },
  { category: 'sports', question: 'What is the fastest recorded tennis serve speed?', choices: ['155 mph', '163 mph', '171 mph', '178 mph'], answer: 1 },
  { category: 'sports', question: 'How many weight classes are in Olympic boxing?', choices: ['8', '10', '13', '17'], answer: 2 },
  { category: 'sports', question: 'Which F1 driver has the most race wins?', choices: ['Schumacher', 'Hamilton', 'Vettel', 'Verstappen'], answer: 1 },
  { category: 'sports', question: 'What sport is played in the Ryder Cup?', choices: ['Tennis', 'Golf', 'Polo', 'Cricket'], answer: 1 },

  // Science — harder
  { category: 'science', question: 'What is the half-life of Carbon-14?', choices: ['1,730 yrs', '5,730 yrs', '11,460 yrs', '28,800 yrs'], answer: 1 },
  { category: 'science', question: 'Which planet has the most moons?', choices: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], answer: 1 },
  { category: 'science', question: 'What is the rarest blood type?', choices: ['O-', 'B-', 'AB-', 'A-'], answer: 2 },
  { category: 'science', question: 'How many chromosomes do humans have?', choices: ['23', '44', '46', '48'], answer: 2 },
  { category: 'science', question: 'What element has the highest melting point?', choices: ['Iron', 'Tungsten', 'Titanium', 'Osmium'], answer: 1 },
  { category: 'science', question: 'What is the Mohs hardness of quartz?', choices: ['5', '6', '7', '8'], answer: 2 },
  { category: 'science', question: 'Which subatomic particle has no charge?', choices: ['Proton', 'Electron', 'Neutron', 'Positron'], answer: 2 },
  { category: 'science', question: 'What is the most abundant gas in Earth\'s atmosphere?', choices: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], answer: 2 },
  { category: 'science', question: 'How far is the Sun from Earth in light-minutes?', choices: ['4', '8', '12', '16'], answer: 1 },
  { category: 'science', question: 'What is the pH of pure water?', choices: ['5', '6', '7', '8'], answer: 2 },
  { category: 'science', question: 'Which organ produces insulin?', choices: ['Liver', 'Kidney', 'Pancreas', 'Thyroid'], answer: 2 },
  { category: 'science', question: 'What is the speed of sound in air at sea level (approx)?', choices: ['343 m/s', '500 m/s', '700 m/s', '1000 m/s'], answer: 0 },
];

const categoryIcons: Record<TriviaCategory, string> = {
  entertainment: '🎬',
  world: '🌍',
  history: '📜',
  sports: '🏆',
  science: '🔬',
};

export function getCategoryIcon(cat: TriviaCategory): string {
  return categoryIcons[cat];
}

export function pickTriviaQuestions(rng: () => number, count: number): TriviaQuestion[] {
  // Shuffle and pick `count` questions, ensuring category variety
  const shuffled = questions.slice().sort(() => rng() - 0.5);
  const picked: TriviaQuestion[] = [];
  const usedCats = new Set<TriviaCategory>();

  // First pass: one from each category
  for (const q of shuffled) {
    if (picked.length >= count) break;
    if (!usedCats.has(q.category)) {
      usedCats.add(q.category);
      picked.push(q);
    }
  }

  // Fill remaining
  for (const q of shuffled) {
    if (picked.length >= count) break;
    if (!picked.includes(q)) {
      picked.push(q);
    }
  }

  return picked;
}
