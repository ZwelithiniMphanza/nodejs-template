"use strict";

const user = require("./user");

describe("readMany", () => {
	it("readMany should return the defined object above", () => {
		expect(user.readMany()).toEqual({"text": "GET: it works!"});
	});
});