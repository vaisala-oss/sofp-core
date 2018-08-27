const greetController = require('./greetController');

test('Greeting Jason', () => {
	var context = { params: { query: { name: 'Jason'}  } };
	expect(greetController.getGreeting(context)).toEqual({ message: 'Hello Jason' });
});