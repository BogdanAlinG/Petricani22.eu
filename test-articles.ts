import { getAllVisibleArticles } from './src/data/articles';

async function test() {
  console.log('Fetching visible articles...');
  const articles = await getAllVisibleArticles();
  console.log('Result length:', articles.length);
  articles.forEach(a => {
    console.log(`ID: ${a.id}, Category: "${a.category}"`);
  });
}

test();
