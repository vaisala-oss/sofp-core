// This function has the same name as an operationId in the OpenAPI document.
exports.getFoo = function getFoo(context) {
    const bar = context.params.query.bar;
    return {message: `Foo ${bar}`};
}