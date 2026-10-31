import { TriviaQuestion, TriviaCategory } from './types';
import { createRng } from './seed';

const questions: TriviaQuestion[] = [
  // ── Entertainment ──────────────────────────────────────────────
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
  { category: 'entertainment', question: 'What is the best-selling video game of all time?', choices: ['Tetris', 'Minecraft', 'GTA V', 'Wii Sports'], answer: 1 },
  { category: 'entertainment', question: 'Which band released "Bohemian Rhapsody"?', choices: ['Led Zeppelin', 'Queen', 'Pink Floyd', 'The Rolling Stones'], answer: 1 },
  { category: 'entertainment', question: 'Who directed "Parasite" (2019)?', choices: ['Park Chan-wook', 'Bong Joon-ho', 'Wong Kar-wai', 'Hirokazu Kore-eda'], answer: 1 },
  { category: 'entertainment', question: 'What year was the first iPhone released?', choices: ['2005', '2006', '2007', '2008'], answer: 2 },
  { category: 'entertainment', question: 'Which TV show features the character Walter White?', choices: ['The Wire', 'Breaking Bad', 'Ozark', 'Better Call Saul'], answer: 1 },
  { category: 'entertainment', question: 'What studio created "The Legend of Zelda"?', choices: ['Sony', 'Nintendo', 'Sega', 'Capcom'], answer: 1 },
  { category: 'entertainment', question: 'Who wrote "1984"?', choices: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], answer: 1 },
  { category: 'entertainment', question: 'What film won the first Best Picture Oscar?', choices: ['Wings', 'Sunrise', 'The Jazz Singer', 'Metropolis'], answer: 0 },
  { category: 'entertainment', question: 'Which artist painted "The Persistence of Memory"?', choices: ['Picasso', 'Dali', 'Magritte', 'Miro'], answer: 1 },
  { category: 'entertainment', question: 'What was the first feature-length animated Disney film?', choices: ['Pinocchio', 'Snow White', 'Fantasia', 'Dumbo'], answer: 1 },
  { category: 'entertainment', question: 'Who created the comic strip "Peanuts"?', choices: ['Jim Davis', 'Charles Schulz', 'Bill Watterson', 'Gary Larson'], answer: 1 },
  { category: 'entertainment', question: 'What is the longest-running Broadway show?', choices: ['Cats', 'The Phantom of the Opera', 'Hamilton', 'Chicago'], answer: 1 },
  { category: 'entertainment', question: 'Which rapper released "To Pimp a Butterfly"?', choices: ['J. Cole', 'Kendrick Lamar', 'Drake', 'Kanye West'], answer: 1 },
  { category: 'entertainment', question: 'What year did Netflix start streaming?', choices: ['2005', '2007', '2009', '2011'], answer: 1 },
  { category: 'entertainment', question: 'Who directed "2001: A Space Odyssey"?', choices: ['Spielberg', 'Kubrick', 'Scott', 'Tarkovsky'], answer: 1 },
  { category: 'entertainment', question: 'What is Mario\'s brother\'s name?', choices: ['Wario', 'Luigi', 'Toad', 'Yoshi'], answer: 1 },
  { category: 'entertainment', question: 'Which author wrote "The Great Gatsby"?', choices: ['Hemingway', 'F. Scott Fitzgerald', 'Faulkner', 'Steinbeck'], answer: 1 },
  { category: 'entertainment', question: 'What was Nirvana\'s breakthrough album?', choices: ['Bleach', 'Nevermind', 'In Utero', 'Incesticide'], answer: 1 },
  { category: 'entertainment', question: 'Who voices Woody in Toy Story?', choices: ['Tim Allen', 'Tom Hanks', 'Robin Williams', 'Billy Crystal'], answer: 1 },
  { category: 'entertainment', question: 'What year was YouTube founded?', choices: ['2003', '2004', '2005', '2006'], answer: 2 },
  { category: 'entertainment', question: 'Which Pixar film features a robot named WALL-E?', choices: ['Robots', 'WALL-E', 'Big Hero 6', 'The Iron Giant'], answer: 1 },
  { category: 'entertainment', question: 'Who painted the ceiling of the Sistine Chapel?', choices: ['Da Vinci', 'Michelangelo', 'Raphael', 'Botticelli'], answer: 1 },
  { category: 'entertainment', question: 'What is the highest-grossing film of all time (unadjusted)?', choices: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: The Force Awakens'], answer: 1 },
  { category: 'entertainment', question: 'Which instrument does Yo-Yo Ma play?', choices: ['Violin', 'Cello', 'Viola', 'Bass'], answer: 1 },
  { category: 'entertainment', question: 'What game franchise features Master Chief?', choices: ['Gears of War', 'Halo', 'Destiny', 'Call of Duty'], answer: 1 },
  { category: 'entertainment', question: 'Who wrote "Harry Potter"?', choices: ['Tolkien', 'C.S. Lewis', 'J.K. Rowling', 'Philip Pullman'], answer: 2 },
  { category: 'entertainment', question: 'What was the first song played on MTV?', choices: ['Thriller', 'Video Killed the Radio Star', 'You Better Run', 'Rapture'], answer: 1 },
  { category: 'entertainment', question: 'Which streaming service produced "Stranger Things"?', choices: ['Hulu', 'Amazon', 'Netflix', 'HBO'], answer: 2 },

  // ── World ──────────────────────────────────────────────────────
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
  { category: 'world', question: 'What is the tallest building in the world (2024)?', choices: ['Shanghai Tower', 'Burj Khalifa', 'Merdeka 118', 'One World Trade'], answer: 1 },
  { category: 'world', question: 'Which river is the longest in the world?', choices: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 1 },
  { category: 'world', question: 'What country has the most official languages?', choices: ['India', 'South Africa', 'Bolivia', 'Zimbabwe'], answer: 3 },
  { category: 'world', question: 'Which ocean is the smallest?', choices: ['Indian', 'Southern', 'Arctic', 'Atlantic'], answer: 2 },
  { category: 'world', question: 'What is the most populous city in Africa?', choices: ['Cairo', 'Lagos', 'Kinshasa', 'Johannesburg'], answer: 1 },
  { category: 'world', question: 'Which country is home to the most UNESCO World Heritage Sites?', choices: ['China', 'Italy', 'Spain', 'France'], answer: 1 },
  { category: 'world', question: 'What is the highest waterfall in the world?', choices: ['Niagara Falls', 'Victoria Falls', 'Angel Falls', 'Iguazu Falls'], answer: 2 },
  { category: 'world', question: 'Which country produces the most coffee?', choices: ['Colombia', 'Vietnam', 'Brazil', 'Ethiopia'], answer: 2 },
  { category: 'world', question: 'What is the largest lake in Africa?', choices: ['Lake Tanganyika', 'Lake Victoria', 'Lake Malawi', 'Lake Chad'], answer: 1 },
  { category: 'world', question: 'Which capital city is the highest above sea level?', choices: ['Bogota', 'Quito', 'La Paz', 'Addis Ababa'], answer: 2 },
  { category: 'world', question: 'What is the most spoken language in South America?', choices: ['Spanish', 'Portuguese', 'English', 'Quechua'], answer: 1 },
  { category: 'world', question: 'Which country has the longest coastline?', choices: ['Russia', 'Indonesia', 'Canada', 'Australia'], answer: 2 },
  { category: 'world', question: 'What is the smallest US state by area?', choices: ['Delaware', 'Connecticut', 'Rhode Island', 'Hawaii'], answer: 2 },
  { category: 'world', question: 'Which mountain is the tallest in North America?', choices: ['Mt. Rainier', 'Denali', 'Mt. Logan', 'Mt. Whitney'], answer: 1 },
  { category: 'world', question: 'What country is shaped like a boot?', choices: ['Greece', 'Italy', 'Portugal', 'Croatia'], answer: 1 },
  { category: 'world', question: 'Which continent has the most countries?', choices: ['Asia', 'Europe', 'Africa', 'South America'], answer: 2 },
  { category: 'world', question: 'What is the largest island in the Mediterranean?', choices: ['Sardinia', 'Corsica', 'Sicily', 'Crete'], answer: 2 },
  { category: 'world', question: 'Which city straddles two continents?', choices: ['Cairo', 'Istanbul', 'Moscow', 'Dubai'], answer: 1 },
  { category: 'world', question: 'What is the most densely populated country?', choices: ['Singapore', 'Monaco', 'Bangladesh', 'Malta'], answer: 1 },
  { category: 'world', question: 'Which country has the most volcanoes?', choices: ['Japan', 'Indonesia', 'Iceland', 'Chile'], answer: 1 },
  { category: 'world', question: 'What is the longest wall in the world?', choices: ['Hadrian\'s Wall', 'Berlin Wall', 'Great Wall of China', 'Western Wall'], answer: 2 },
  { category: 'world', question: 'Which US state has the most national parks?', choices: ['Alaska', 'Utah', 'California', 'Colorado'], answer: 2 },
  { category: 'world', question: 'What is the driest desert in the world?', choices: ['Sahara', 'Atacama', 'Gobi', 'Namib'], answer: 1 },
  { category: 'world', question: 'Which European country has the most forests?', choices: ['Germany', 'Finland', 'Sweden', 'Russia'], answer: 2 },
  { category: 'world', question: 'What is the largest country in South America?', choices: ['Argentina', 'Colombia', 'Brazil', 'Peru'], answer: 2 },
  { category: 'world', question: 'Which sea is the saltiest?', choices: ['Red Sea', 'Dead Sea', 'Caspian Sea', 'Black Sea'], answer: 1 },
  { category: 'world', question: 'What currency is used in Japan?', choices: ['Yuan', 'Won', 'Yen', 'Ringgit'], answer: 2 },

  // ── History ────────────────────────────────────────────────────
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
  { category: 'history', question: 'Who was the first person to circumnavigate the globe?', choices: ['Columbus', 'Magellan', 'Elcano', 'Drake'], answer: 2 },
  { category: 'history', question: 'What year did the Berlin Wall fall?', choices: ['1987', '1988', '1989', '1990'], answer: 2 },
  { category: 'history', question: 'Which ancient wonder was located in Alexandria?', choices: ['Colossus', 'Lighthouse', 'Hanging Gardens', 'Temple of Artemis'], answer: 1 },
  { category: 'history', question: 'Who was the first US president?', choices: ['Adams', 'Jefferson', 'Washington', 'Franklin'], answer: 2 },
  { category: 'history', question: 'What event started the French Revolution?', choices: ['Bastille storming', 'Tennis Court Oath', 'Reign of Terror', 'March on Versailles'], answer: 0 },
  { category: 'history', question: 'Which empire was ruled by Suleiman the Magnificent?', choices: ['Persian', 'Mughal', 'Ottoman', 'Byzantine'], answer: 2 },
  { category: 'history', question: 'What year did the Titanic sink?', choices: ['1910', '1911', '1912', '1913'], answer: 2 },
  { category: 'history', question: 'Who invented the printing press?', choices: ['Da Vinci', 'Gutenberg', 'Galileo', 'Copernicus'], answer: 1 },
  { category: 'history', question: 'What ancient trade route connected China to Rome?', choices: ['Spice Route', 'Silk Road', 'Amber Road', 'Incense Route'], answer: 1 },
  { category: 'history', question: 'Which country was the first to grant women the right to vote?', choices: ['USA', 'UK', 'New Zealand', 'Finland'], answer: 2 },
  { category: 'history', question: 'What year did the US Declaration of Independence get signed?', choices: ['1774', '1775', '1776', '1777'], answer: 2 },
  { category: 'history', question: 'Who was the longest-reigning British monarch before Elizabeth II?', choices: ['George III', 'Victoria', 'Henry VIII', 'Edward VII'], answer: 1 },
  { category: 'history', question: 'What was the name of the first satellite launched into space?', choices: ['Explorer 1', 'Sputnik', 'Vostok', 'Apollo'], answer: 1 },
  { category: 'history', question: 'Which battle is considered the turning point of the US Civil War?', choices: ['Antietam', 'Gettysburg', 'Bull Run', 'Vicksburg'], answer: 1 },
  { category: 'history', question: 'What year did the Black Death reach Europe?', choices: ['1247', '1298', '1347', '1399'], answer: 2 },
  { category: 'history', question: 'Who led India to independence from Britain?', choices: ['Nehru', 'Gandhi', 'Bose', 'Patel'], answer: 1 },
  { category: 'history', question: 'What civilization built the Parthenon?', choices: ['Roman', 'Greek', 'Persian', 'Egyptian'], answer: 1 },
  { category: 'history', question: 'Which US president was assassinated in 1963?', choices: ['Lincoln', 'McKinley', 'JFK', 'Garfield'], answer: 2 },
  { category: 'history', question: 'What was the largest empire in history by land area?', choices: ['Roman', 'Mongol', 'British', 'Ottoman'], answer: 2 },
  { category: 'history', question: 'What year did humans first land on the moon?', choices: ['1967', '1968', '1969', '1970'], answer: 2 },
  { category: 'history', question: 'Who painted the Mona Lisa?', choices: ['Raphael', 'Da Vinci', 'Michelangelo', 'Caravaggio'], answer: 1 },
  { category: 'history', question: 'What ancient civilization built pyramids at Giza?', choices: ['Sumerian', 'Egyptian', 'Nubian', 'Babylonian'], answer: 1 },
  { category: 'history', question: 'Which explorer reached the Americas in 1492?', choices: ['Vespucci', 'Magellan', 'Columbus', 'Cabot'], answer: 2 },
  { category: 'history', question: 'What year did World War II end?', choices: ['1943', '1944', '1945', '1946'], answer: 2 },
  { category: 'history', question: 'Who was the first woman to fly solo across the Atlantic?', choices: ['Bessie Coleman', 'Amelia Earhart', 'Harriet Quimby', 'Jacqueline Cochran'], answer: 1 },
  { category: 'history', question: 'What ancient city was destroyed by the eruption of Vesuvius?', choices: ['Rome', 'Pompeii', 'Athens', 'Carthage'], answer: 1 },
  { category: 'history', question: 'Which dynasty built the Great Wall of China?', choices: ['Han', 'Ming', 'Qin', 'Tang'], answer: 2 },
  { category: 'history', question: 'What was the code name for the D-Day invasion?', choices: ['Barbarossa', 'Overlord', 'Market Garden', 'Torch'], answer: 1 },

  // ── Sports ─────────────────────────────────────────────────────
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
  { category: 'sports', question: 'How many players are on a basketball team on the court?', choices: ['4', '5', '6', '7'], answer: 1 },
  { category: 'sports', question: 'Which country has won the most FIFA World Cups?', choices: ['Germany', 'Argentina', 'Brazil', 'Italy'], answer: 2 },
  { category: 'sports', question: 'What is the diameter of a basketball hoop in inches?', choices: ['16', '18', '20', '22'], answer: 1 },
  { category: 'sports', question: 'Who holds the record for most Olympic gold medals?', choices: ['Usain Bolt', 'Michael Phelps', 'Carl Lewis', 'Mark Spitz'], answer: 1 },
  { category: 'sports', question: 'What is the highest possible score in a single bowling game?', choices: ['200', '250', '300', '350'], answer: 2 },
  { category: 'sports', question: 'Which sport uses a shuttlecock?', choices: ['Tennis', 'Badminton', 'Squash', 'Table Tennis'], answer: 1 },
  { category: 'sports', question: 'How many holes are in a standard golf course?', choices: ['9', '12', '18', '21'], answer: 2 },
  { category: 'sports', question: 'What country hosted the first modern Olympics?', choices: ['France', 'Greece', 'England', 'USA'], answer: 1 },
  { category: 'sports', question: 'Which soccer player is known as "The GOAT"?', choices: ['Ronaldo', 'Messi', 'Pele', 'Maradona'], answer: 1 },
  { category: 'sports', question: 'How many periods are in an NHL hockey game?', choices: ['2', '3', '4', '5'], answer: 1 },
  { category: 'sports', question: 'What is the oldest tennis tournament?', choices: ['US Open', 'French Open', 'Wimbledon', 'Australian Open'], answer: 2 },
  { category: 'sports', question: 'How many rings are on the Olympic flag?', choices: ['3', '4', '5', '6'], answer: 2 },
  { category: 'sports', question: 'Which sport is known as "the beautiful game"?', choices: ['Baseball', 'Basketball', 'Soccer', 'Rugby'], answer: 2 },
  { category: 'sports', question: 'What is the width of a football field in yards?', choices: ['40', '48.5', '53.3', '60'], answer: 2 },
  { category: 'sports', question: 'Who has the most home runs in MLB history?', choices: ['Babe Ruth', 'Hank Aaron', 'Barry Bonds', 'Alex Rodriguez'], answer: 2 },
  { category: 'sports', question: 'What is the national sport of Canada?', choices: ['Hockey', 'Lacrosse', 'Curling', 'Baseball'], answer: 1 },
  { category: 'sports', question: 'How many points is a touchdown worth in American football?', choices: ['5', '6', '7', '8'], answer: 1 },
  { category: 'sports', question: 'Which boxer was known as "The Greatest"?', choices: ['Mike Tyson', 'Muhammad Ali', 'Floyd Mayweather', 'Joe Louis'], answer: 1 },
  { category: 'sports', question: 'What is the highest score in a single gymnastics routine?', choices: ['8.0', '9.0', '10.0', '11.0'], answer: 2 },
  { category: 'sports', question: 'Which country invented volleyball?', choices: ['Brazil', 'Japan', 'USA', 'Italy'], answer: 2 },
  { category: 'sports', question: 'How long is a regulation soccer match in minutes?', choices: ['80', '90', '100', '120'], answer: 1 },
  { category: 'sports', question: 'What sport does Tiger Woods play?', choices: ['Tennis', 'Golf', 'Boxing', 'Swimming'], answer: 1 },
  { category: 'sports', question: 'Which NFL team has won the most Super Bowls?', choices: ['Cowboys', 'Patriots', 'Steelers', '49ers'], answer: 1 },
  { category: 'sports', question: 'What color is the center of an archery target?', choices: ['Red', 'Blue', 'Yellow', 'Black'], answer: 2 },
  { category: 'sports', question: 'How many sets does a man need to win in tennis Grand Slams?', choices: ['2', '3', '4', '5'], answer: 1 },
  { category: 'sports', question: 'Which country dominates table tennis in the Olympics?', choices: ['Japan', 'South Korea', 'China', 'Germany'], answer: 2 },
  { category: 'sports', question: 'What is the minimum age for NBA draft eligibility?', choices: ['17', '18', '19', '20'], answer: 2 },
  { category: 'sports', question: 'Which athlete won 9 Olympic gold medals in track and field?', choices: ['Usain Bolt', 'Carl Lewis', 'Jesse Owens', 'Paavo Nurmi'], answer: 3 },

  // ── Science ────────────────────────────────────────────────────
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
  { category: 'science', question: 'What is the chemical symbol for gold?', choices: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { category: 'science', question: 'How many bones are in the adult human body?', choices: ['186', '206', '226', '246'], answer: 1 },
  { category: 'science', question: 'What is the closest star to Earth after the Sun?', choices: ['Sirius', 'Alpha Centauri', 'Proxima Centauri', 'Barnard\'s Star'], answer: 2 },
  { category: 'science', question: 'What gas do plants absorb from the atmosphere?', choices: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 2 },
  { category: 'science', question: 'What is the hardest natural substance on Earth?', choices: ['Quartz', 'Topaz', 'Corundum', 'Diamond'], answer: 3 },
  { category: 'science', question: 'How many planets are in our solar system?', choices: ['7', '8', '9', '10'], answer: 1 },
  { category: 'science', question: 'What force keeps planets in orbit around the Sun?', choices: ['Magnetism', 'Gravity', 'Friction', 'Inertia'], answer: 1 },
  { category: 'science', question: 'What is the largest organ in the human body?', choices: ['Liver', 'Brain', 'Skin', 'Lungs'], answer: 2 },
  { category: 'science', question: 'What is the chemical formula for table salt?', choices: ['NaO', 'NaCl', 'KCl', 'CaCl'], answer: 1 },
  { category: 'science', question: 'Which planet is known as the Red Planet?', choices: ['Venus', 'Mars', 'Jupiter', 'Mercury'], answer: 1 },
  { category: 'science', question: 'What type of animal is a dolphin?', choices: ['Fish', 'Reptile', 'Mammal', 'Amphibian'], answer: 2 },
  { category: 'science', question: 'What is the boiling point of water in Celsius?', choices: ['90', '95', '100', '110'], answer: 2 },
  { category: 'science', question: 'What part of the cell contains DNA?', choices: ['Ribosome', 'Mitochondria', 'Nucleus', 'Cytoplasm'], answer: 2 },
  { category: 'science', question: 'What is the symbol for the element Oxygen?', choices: ['Ox', 'O', 'Om', 'On'], answer: 1 },
  { category: 'science', question: 'How many legs does a spider have?', choices: ['6', '8', '10', '12'], answer: 1 },
  { category: 'science', question: 'What type of rock is formed from cooled lava?', choices: ['Sedimentary', 'Metamorphic', 'Igneous', 'Limestone'], answer: 2 },
  { category: 'science', question: 'What is the largest planet in our solar system?', choices: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], answer: 1 },
  { category: 'science', question: 'What vitamin does sunlight help the body produce?', choices: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], answer: 3 },
  { category: 'science', question: 'What is the powerhouse of the cell?', choices: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], answer: 2 },
  { category: 'science', question: 'What is absolute zero in Celsius?', choices: ['-173', '-273', '-373', '-473'], answer: 1 },
  { category: 'science', question: 'What type of energy does the Sun primarily emit?', choices: ['Kinetic', 'Nuclear', 'Electromagnetic', 'Chemical'], answer: 2 },
  { category: 'science', question: 'Which element makes up most of the Earth\'s atmosphere?', choices: ['Oxygen', 'Hydrogen', 'Nitrogen', 'Helium'], answer: 2 },
  { category: 'science', question: 'What is the smallest unit of life?', choices: ['Atom', 'Molecule', 'Cell', 'Organ'], answer: 2 },
  { category: 'science', question: 'How many teeth does an adult human have?', choices: ['28', '30', '32', '34'], answer: 2 },
  { category: 'science', question: 'What is the study of fossils called?', choices: ['Geology', 'Paleontology', 'Archaeology', 'Anthropology'], answer: 1 },
  { category: 'science', question: 'What color light has the shortest wavelength?', choices: ['Red', 'Green', 'Blue', 'Violet'], answer: 3 },
  { category: 'science', question: 'What is the most abundant element in the universe?', choices: ['Helium', 'Hydrogen', 'Oxygen', 'Carbon'], answer: 1 },
  { category: 'science', question: 'What is the speed of light in km/s (approx)?', choices: ['100,000', '200,000', '300,000', '400,000'], answer: 2 },
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

// Max questions any single hole will use
const RESERVE_PER_HOLE = 10;

/**
 * Pick trivia questions for a specific hole, ensuring no repeats across holes within a day.
 * Uses the day seed to shuffle the full pool once, then each hole takes a reserved slice.
 */
export function pickTriviaQuestions(daySeed: string, count: number, holeNumber: number): TriviaQuestion[] {
  // Shuffle entire pool deterministically using the day seed
  const dayRng = createRng(daySeed);
  const shuffled = questions.slice().sort(() => dayRng() - 0.5);

  // Each hole gets a reserved slice: hole 1 = [0..9], hole 2 = [10..19], etc.
  const startIdx = (holeNumber - 1) * RESERVE_PER_HOLE;
  const slice = shuffled.slice(startIdx, startIdx + RESERVE_PER_HOLE);

  // Pick with category variety from this hole's slice
  const picked: TriviaQuestion[] = [];
  const usedCats = new Set<TriviaCategory>();

  // First pass: one from each category
  for (const q of slice) {
    if (picked.length >= count) break;
    if (!usedCats.has(q.category)) {
      usedCats.add(q.category);
      picked.push(q);
    }
  }

  // Fill remaining
  for (const q of slice) {
    if (picked.length >= count) break;
    if (!picked.includes(q)) {
      picked.push(q);
    }
  }

  return picked;
}
