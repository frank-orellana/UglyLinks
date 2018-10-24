/*import { hello } from '../src/test';
import { expect } from 'chai';
import 'mocha';

import { DataElements } from '../src/DataElements';

describe('Hello function', () => {

  it('test system working?', () => {
    expect(hello()).to.equal('Hello World!');
  });

});

describe('DataElements',() =>{
  it('DataElements.parseStringAsTemplate', () => {
    const str = '';
    const params = new Map();
    params.set("context",{some_var : "some_value"}); 
    params.set("something_else","some other value");
    params.set("context2",{some_var : {some_inner_var : "some_value_2"}});
    expect(DataElements.parseStringAsTemplate("${context.some_var} ${something_else} ${context2.some_var.some_inner_var}",params)).to.be.equals('some_value some other value some_value_2');
  });
});*/