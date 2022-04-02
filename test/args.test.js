const { Args } = require('../src/args');

test('Args parsing', () => {
  const url =
    'https://hd.kinopoisk.ru/?continueWatching=1&episode=27&rt=4e408995ea402cafb36eaab1d1b9ba0a&season=4&watch=';
  expect(new Args([url, '-q', '720p']).parse()).toMatchObject({ _: [url], q: '720p' });
  expect(new Args(['-q', '720p', '-d', url]).parse()).toMatchObject({
    _: [url],
    q: '720p',
    d: true,
  });
});
