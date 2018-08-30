// This function has the same name as an operationId in the OpenAPI document.
exports.getGreeting = function getGreeting(context) {
    const name = context.params.query.name;
    return {message: `Hello ${name}`};
}

exports.asyncGetGreeting = function asyncGetGreeting(context) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			const name = context.params.query.name;
			resolve({message: `Hello ${name}`});
		}, 100);
	});
}