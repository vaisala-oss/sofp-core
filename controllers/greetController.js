// This function has the same name as an operationId in the OpenAPI document.
exports.getGreeting = function getGreeting(context) {
    const name = context.params.query.name;
    return {message: `Hello ${name}`};
}