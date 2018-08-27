const greetController = require('./greetController');

test('Greeting Jason', () => {
	var context = { params: { query: { name: 'Jason' }  } };
	expect(greetController.getGreeting(context)).toEqual({ message: 'Hello Jason' });
});


test('Async Greeting Jill', () => {
	expect.assertions(1);
	var context = { params: { query: { name: 'Jill' }  } };
	return greetController.asyncGetGreeting(context).then(data => expect(data).toEqual({ message: 'Hello Jill' }));
});