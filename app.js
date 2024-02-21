const express = require('express');
const movies = require('./movies.json')
const crypto = require('node:crypto') // generar ID
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
const app = express();

const ACCEPTED_ORIGINS = ['http://localhost:8080', 'https://myapp.com']

app.disable('x-powered-by');

const PORT = process.env.PORT ?? 3000;

app.use(express.json())

app.get('/', (req, res) => {
  res.status(200).send('<h1> Hola Mundo </h1>');
});

app.get('/movies', (req, res) => {
  const origin = req.header('origin');
  if(ACCEPTED_ORIGINS.includes(origin) || !origin){
    res.header('Access-Control-Allow-Origin', origin);
  }
  const { genre } = req.query
  if(genre){
    const moviesGenre = movies.filter(
      movie => movie.genre.some(
        g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(moviesGenre)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movie = movies.find(movie => movie.id === id);
  if(movie) res.json(movie);
  res.status(404).json({message: 'Movie not found'})
});

app.post('/movies', (req, res) => {

  const result = validateMovie(req.body);

  if(result.error){
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ... result.data
  }

  movies.push(newMovie)
  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params;
  const result = validatePartialMovie(req.body)
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if(movieIndex < 0) return res.status(404).json(
    { message: 'Movie not found'}
  );
  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  
    movies[movieIndex] = updateMovie;
    return res.json(updateMovie);

})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin');
  if(ACCEPTED_ORIGINS.includes(origin) || !origin){
    res.header('Access-Control-Allow-Origin', origin);
  }
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if(movieIndex < 0) return res.status(404).json(
    { message: 'Movie not found'}
  );
  movies.splice(movieIndex, 1);
  res.status(204).send();
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin');
  if(ACCEPTED_ORIGINS.includes(origin) || !origin){
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'DELETE, PATCH, OPTIONS')
  }
  res.send(200);
})

app.listen(PORT, () => {
  console.log(`Server is listening on port http://localhost:${PORT}`);
});