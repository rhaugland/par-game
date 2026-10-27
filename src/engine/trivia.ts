import { TriviaQuestion, TriviaCategory } from './types';

const questions: TriviaQuestion[] = [
  // Entertainment
  { category: 'entertainment', question: 'Which film won Best Picture at the 2020 Oscars?', choices: ['1917', 'Parasite', 'Joker', 'Once Upon a Time'], answer: 1 },
  { category: 'entertainment', question: 'What is the highest-grossing film of all time?', choices: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: TFA'], answer: 1 },
  { category: 'entertainment', question: 'Who played Walter White in Breaking Bad?', choices: ['Aaron Paul', 'Bryan Cranston', 'Bob Odenkirk', 'Dean Norris'], answer: 1 },
  { category: 'entertainment', question: 'Which band released "Bohemian Rhapsody"?', choices: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], answer: 2 },
  { category: 'entertainment', question: 'What year was the first iPhone released?', choices: ['2005', '2006', '2007', '2008'], answer: 2 },
  { category: 'entertainment', question: 'Who directed Inception?', choices: ['Steven Spielberg', 'Christopher Nolan', 'James Cameron', 'Ridley Scott'], answer: 1 },
  { category: 'entertainment', question: 'Which streaming service made "Stranger Things"?', choices: ['Hulu', 'HBO Max', 'Disney+', 'Netflix'], answer: 3 },
  { category: 'entertainment', question: 'What is the name of the dragon in Shrek?', choices: ['Smaug', 'Dragon', 'Norbert', 'Falkor'], answer: 1 },
  { category: 'entertainment', question: 'Who sang "Rolling in the Deep"?', choices: ['Beyonce', 'Adele', 'Rihanna', 'Taylor Swift'], answer: 1 },
  { category: 'entertainment', question: 'What video game franchise features Master Chief?', choices: ['Call of Duty', 'Halo', 'Gears of War', 'Destiny'], answer: 1 },

  // World Events
  { category: 'world', question: 'In what year did the Berlin Wall fall?', choices: ['1987', '1988', '1989', '1990'], answer: 2 },
  { category: 'world', question: 'Which country hosted the 2016 Olympics?', choices: ['China', 'UK', 'Japan', 'Brazil'], answer: 3 },
  { category: 'world', question: 'What is the most spoken language in the world?', choices: ['English', 'Mandarin', 'Spanish', 'Hindi'], answer: 1 },
  { category: 'world', question: 'Which ocean is the largest?', choices: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
  { category: 'world', question: 'What country has the most UNESCO World Heritage Sites?', choices: ['China', 'Italy', 'Spain', 'France'], answer: 1 },
  { category: 'world', question: 'What is the capital of Australia?', choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], answer: 2 },
  { category: 'world', question: 'Which river is the longest in the world?', choices: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], answer: 1 },
  { category: 'world', question: 'What currency is used in Japan?', choices: ['Won', 'Yuan', 'Yen', 'Rupee'], answer: 2 },
  { category: 'world', question: 'Which country has the largest population?', choices: ['India', 'China', 'USA', 'Indonesia'], answer: 0 },
  { category: 'world', question: 'What year was the Euro currency introduced?', choices: ['1997', '1999', '2001', '2002'], answer: 1 },

  // History
  { category: 'history', question: 'Who was the first person to walk on the moon?', choices: ['Buzz Aldrin', 'Neil Armstrong', 'John Glenn', 'Yuri Gagarin'], answer: 1 },
  { category: 'history', question: 'In which year did the Titanic sink?', choices: ['1910', '1911', '1912', '1913'], answer: 2 },
  { category: 'history', question: 'Who painted the Mona Lisa?', choices: ['Michelangelo', 'Raphael', 'Da Vinci', 'Donatello'], answer: 2 },
  { category: 'history', question: 'What ancient wonder was in Alexandria?', choices: ['Colossus', 'Lighthouse', 'Hanging Gardens', 'Temple of Artemis'], answer: 1 },
  { category: 'history', question: 'Who wrote the Declaration of Independence?', choices: ['Ben Franklin', 'John Adams', 'Thomas Jefferson', 'George Washington'], answer: 2 },
  { category: 'history', question: 'What year did World War II end?', choices: ['1943', '1944', '1945', '1946'], answer: 2 },
  { category: 'history', question: 'Which empire built the Colosseum?', choices: ['Greek', 'Roman', 'Ottoman', 'Byzantine'], answer: 1 },
  { category: 'history', question: 'Who was the first President of the United States?', choices: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Ben Franklin'], answer: 2 },
  { category: 'history', question: 'What year did the French Revolution begin?', choices: ['1776', '1789', '1799', '1804'], answer: 1 },
  { category: 'history', question: 'Who discovered penicillin?', choices: ['Pasteur', 'Fleming', 'Lister', 'Koch'], answer: 1 },

  // Sports
  { category: 'sports', question: 'How many players are on a basketball team on the court?', choices: ['4', '5', '6', '7'], answer: 1 },
  { category: 'sports', question: 'Which country has won the most FIFA World Cups?', choices: ['Germany', 'Argentina', 'Italy', 'Brazil'], answer: 3 },
  { category: 'sports', question: 'What sport is played at Wimbledon?', choices: ['Cricket', 'Tennis', 'Golf', 'Rugby'], answer: 1 },
  { category: 'sports', question: 'How many holes in a standard round of golf?', choices: ['9', '12', '16', '18'], answer: 3 },
  { category: 'sports', question: 'Who holds the most Olympic gold medals?', choices: ['Usain Bolt', 'Michael Phelps', 'Carl Lewis', 'Mark Spitz'], answer: 1 },
  { category: 'sports', question: 'What sport uses a puck?', choices: ['Lacrosse', 'Field Hockey', 'Ice Hockey', 'Polo'], answer: 2 },
  { category: 'sports', question: 'How many points is a touchdown worth?', choices: ['3', '5', '6', '7'], answer: 2 },
  { category: 'sports', question: 'Which team has won the most Super Bowls?', choices: ['Cowboys', 'Patriots', 'Steelers', '49ers'], answer: 1 },
  { category: 'sports', question: 'What is the diameter of a basketball hoop in inches?', choices: ['16', '18', '20', '22'], answer: 1 },
  { category: 'sports', question: 'In what year were the first modern Olympics held?', choices: ['1892', '1896', '1900', '1904'], answer: 1 },

  // Science
  { category: 'science', question: 'What planet is known as the Red Planet?', choices: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
  { category: 'science', question: 'What is the chemical symbol for gold?', choices: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { category: 'science', question: 'How many bones are in the adult human body?', choices: ['186', '196', '206', '216'], answer: 2 },
  { category: 'science', question: 'What gas do plants absorb from the atmosphere?', choices: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 2 },
  { category: 'science', question: 'What is the speed of light (approx mph)?', choices: ['186,000', '670M', '300,000', '1B'], answer: 1 },
  { category: 'science', question: 'What is the hardest natural substance?', choices: ['Quartz', 'Topaz', 'Diamond', 'Ruby'], answer: 2 },
  { category: 'science', question: 'What is the largest organ in the human body?', choices: ['Liver', 'Brain', 'Lungs', 'Skin'], answer: 3 },
  { category: 'science', question: 'How many planets are in our solar system?', choices: ['7', '8', '9', '10'], answer: 1 },
  { category: 'science', question: 'What element does "O" represent?', choices: ['Osmium', 'Oxygen', 'Oganesson', 'Olivine'], answer: 1 },
  { category: 'science', question: 'What force keeps us on the ground?', choices: ['Magnetism', 'Friction', 'Gravity', 'Inertia'], answer: 2 },
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
