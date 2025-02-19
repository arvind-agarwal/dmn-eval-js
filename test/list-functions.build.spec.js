/*
*  ©2017-2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/
const chalk = require('chalk');
const chai = require('chai');
const assertArrays = require('chai-arrays');
chai.use(assertArrays);
const expect = chai.expect;
const FEEL = require('../dist/feel');

describe(chalk.blue('Built-in list functions tests'), function () {

  it('should support function definition', function () {
    let context = {
      l1: [{ formCode: "profile", toolkitCode: "ba" }, { formCode: "strategy", toolkitCode: "ba" }],
      x: 1,
      l2: [{ x: 1 }, { x: 5 }, { x: 3 }, { x: 2 }, { x: 6 }, { x: 8 }]
    };

    let condition = 'function(a,b) a.formCode < b.formCode and count(l1)=2';
    let parsedGrammar = FEEL.parse(condition);
    let result = parsedGrammar.build(context);
    const s1 = result.invoke(context.l1[0], context.l1[1]);
    expect(s1).to.be.true;

    condition = 'some i in [1, 2, 3, 4, 5] satisfies (i % 2)=0';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.true;

    condition = 'sort([5,4,21,3,1])';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql([1,3,4,5,21]);

    condition = 'sort(l2, function(a,b) a.x > b.x)';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 5 }, { x: 6 }, { x: 8 }]);

    condition = 'sort(l2, function(a,b) a.x < b.x)';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql([{ x: 8 }, { x: 6 }, { x: 5 }, { x: 3 }, { x: 2 }, { x: 1 }]);

  });

  it('should support if expression', function () {
    let context = { l1: [{ formCode: "profile", toolkitCode: "ba" }, { formCode: "strategy", toolkitCode: "ba" }], x: 1 };

    let condition = 'if l1.length >= 2 then "LENMORETHAN2" else "LENLESSTHANTWO"';
    let parsedGrammar = FEEL.parse(condition);
    let result = parsedGrammar.build(context);
    expect(result).to.equal('LENMORETHAN2');


    condition = '(l1[toolkitCode="ba"])[-1]';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql({ formCode: "strategy", toolkitCode: "ba" });

    condition = 'l1[x-1]';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql({ formCode: "profile", toolkitCode: "ba" });


    condition = 'l1[toolkitCode="ba" or formCode="profile"]';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql([{ formCode: "profile", toolkitCode: "ba" }, { formCode: "strategy", toolkitCode: "ba" }]);

    condition = 'l1[toolkitCode="ba" and formCode="profile"]';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql([{ formCode: "profile", toolkitCode: "ba" }]);

    condition = '(l1[toolkitCode="ba" and formCode="profile"])[0]';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql({ formCode: "profile", toolkitCode: "ba" });

    condition = '(l1[toolkitCode="ba" and formCode="profile1"])[0]';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.undefined;


    condition = 'if l1.length >= 2 and (some item in l1 satisfies item.formCode="profile1") then "LENMORETHAN2" else "LENLESSTHANTWO"';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.equal('LENLESSTHANTWO');



  });

  it('should support list filterlist function', function () {
    let context = { l1: [{ formCode: "profile", toolkitCode: "ba" }, { formCode: "strategy", toolkitCode: "ba" }] };

    let condition = "[1,2,3,4,5]";
    let parsedGrammar = FEEL.parse(condition);
    let result = parsedGrammar.build(context);
    expect(result).to.eql([1, 2, 3, 4, 5]);

    condition = 'for i in [1, 2, 3, 4, 5] return i * i';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql([1, 4, 9, 16, 25]);

    condition = 'for i in l1 return i.formCode';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.eql(["profile", "strategy"]);

    condition = "l1";
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).not.to.be.undefined;

    condition = "l1.length";
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.equal(2);

    // condition = "some i in [1, 2, 3, 4, 5] satisfies i > 4";
    condition = "some i in [1, 2, 3, 4, 5] satisfies i > 4";
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.true;

    condition = "some i in [1, 2, 3, 4, 5] satisfies i  >= 10";
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.false;

    condition = 'some i in l1 satisfies i.toolkitCode = "ba"';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.true;

    condition = 'every i in l1 satisfies i.formCode = "profile"';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.false;

    condition = 'every i in l1 satisfies i.toolkitCode = "ba"';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.true;

    condition = 'every i in l1 satisfies i.toolkitCode = "ba" and i.formCode = "profile"';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.false;

    condition = 'every i in l1 satisfies i.toolkitCode = "ba" and i.formCode != "profile1"';
    parsedGrammar = FEEL.parse(condition);
    result = parsedGrammar.build(context);
    expect(result).to.be.true;

    // condition = 'filterlist(l1, "formCode" ,"==","profile", "formCode")';
    // parsedGrammar = FEEL.parse(condition);

    // result = parsedGrammar.build(context);
    // expect(result).to.eql(['profile']);

    // result = parsedGrammar.build({ l1: [] });
    // expect(result).to.eql([]);

    // result = parsedGrammar.build({ l1: null });
    // expect(result).to.eql(null);

    // condition = 'filterlist(l1, "toolkitCode", "=","ba","")';
    // parsedGrammar = FEEL.parse(condition);
    // result = parsedGrammar.build(context);
    // expect(result).to.eql(context.l1);

    // condition = 'filterlist(l1, "toolkitCode", "=", "ba", "")';
    // parsedGrammar = FEEL.parse(condition);
    // result = parsedGrammar.build(context);
    // expect(result).to.eql(context.l1);
  });


  it('should support list contains function', function () {
    const condition = 'list contains(list, element)';
    const parsedGrammar = FEEL.parse(condition);
    let result = parsedGrammar.build({ list: ['foo', 'bar'], element: 'foo' });
    expect(result).to.be.true;
    result = parsedGrammar.build({ list: ['foo', 'bar'], element: 'baz' });
    expect(result).to.be.false;
    result = parsedGrammar.build({ list: [], element: 'foo' });
    expect(result).to.be.false;
    result = parsedGrammar.build({ list: null, element: 'foo' });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: ['foo'], element: null });
    expect(result).to.be.false;
    result = parsedGrammar.build({ list: undefined, element: 'foo' });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ list: ['foo'], element: undefined });
    expect(result).to.be.false;
  });

  it('should support count function', function () {
    const expression = 'count(list)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: ['foobar', 'bar'] });
    expect(result).to.equal(2);
    result = parsedGrammar.build({ list: [] });
    expect(result).to.equal(0);
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

  it('should support min function', function () {
    const expression = 'min(list)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: [2, 1, 5] });
    expect(result).to.equal(1);
    result = parsedGrammar.build({ list: [] });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

  it('should support max function', function () {
    const expression = 'max(list)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: [2, 1, 5] });
    expect(result).to.equal(5);
    result = parsedGrammar.build({ list: [] });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

  it('should support sum function', function () {
    const expression = 'sum(list)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: [2, 1, 5] });
    expect(result).to.equal(8);
    result = parsedGrammar.build({ list: [] });
    expect(result).to.equal(0);
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

  it('should support mean function', function () {
    const expression = 'mean(list)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: [2, 1, 5] });
    expect(result).to.equal(2 + 2 / 3);
    result = parsedGrammar.build({ list: [] });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

  // it('should support and function', function() {
  //   const expression = 'and(list)';
  //   const parsedGrammar = FEEL.parse(expression);
  //   let result = parsedGrammar.build({ list: [true, false] });
  //   expect(result).to.equal(false);
  //   result = parsedGrammar.build({ list: [true, true] });
  //   expect(result).to.equal(true);
  //   result = parsedGrammar.build({ list: [] });
  //   expect(result).to.equal(true);
  //   result = parsedGrammar.build({ list: null });
  //   expect(result).to.be.null;
  //   result = parsedGrammar.build({ list: undefined });
  //   expect(result).to.be.undefined;
  // });

  // it('should support or function', function() {
  //   const expression = 'or(list)';
  //   const parsedGrammar = FEEL.parse(expression);
  //   let result = parsedGrammar.build({ list: [false, false] });
  //   expect(result).to.equal(false);
  //   result = parsedGrammar.build({ list: [true, false] });
  //   expect(result).to.equal(true);
  //   result = parsedGrammar.build({ list: [] });
  //   expect(result).to.equal(false);
  //   result = parsedGrammar.build({ list: null });
  //   expect(result).to.be.null;
  //   result = parsedGrammar.build({ list: undefined });
  //   expect(result).to.be.undefined;
  // });

  it('should support append function', function () {
    const expression = 'append(list, element)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ element: 'foo', list: ['bar'] });
    expect(result).to.be.equalTo(['bar', 'foo']);
    result = parsedGrammar.build({ element: 'foo', list: [] });
    expect(result).to.be.equalTo(['foo']);
    result = parsedGrammar.build({ element: 'foo', list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ element: 'foo', list: undefined });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ element: null, list: ['bar'] });
    expect(result).to.be.equalTo(['bar', null]);
    result = parsedGrammar.build({ element: undefined, list: ['bar'] });
    expect(result).to.be.equalTo(['bar']);
  });

  it('should support concatenate function', function () {
    const expression = 'concatenate(list1, list2)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list1: ['foo', 'bar'], list2: ['f', 'b'] });
    expect(result).to.be.equalTo(['foo', 'bar', 'f', 'b']);
    result = parsedGrammar.build({ list1: ['foo', 'bar'], list2: [] });
    expect(result).to.be.equalTo(['foo', 'bar']);
    result = parsedGrammar.build({ list1: [], list2: ['f', 'b'] });
    expect(result).to.be.equalTo(['f', 'b']);
    result = parsedGrammar.build({ list1: [], list2: [] });
    expect(result).to.be.equalTo([]);
    result = parsedGrammar.build({ list1: ['foo', 'bar'], list2: null });
    expect(result).to.be.equalTo(['foo', 'bar']);
    result = parsedGrammar.build({ list1: null, list2: ['f', 'b'] });
    expect(result).to.be.equalTo(['f', 'b']);
    result = parsedGrammar.build({ list1: ['foo', 'bar'], list2: undefined });
    expect(result).to.be.equalTo(['foo', 'bar']);
    result = parsedGrammar.build({ list1: undefined, list2: ['f', 'b'] });
    expect(result).to.be.equalTo(['f', 'b']);
  });

  it('should support insert before function', function () {
    const expression = 'insert before(list, position, element)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ element: 'foo', list: ['bar', 'foobar'], position: 0 });
    expect(result).to.be.equalTo(['foo', 'bar', 'foobar']);
    result = parsedGrammar.build({ element: 'foo', list: ['bar', 'foobar'], position: 1 });
    expect(result).to.be.equalTo(['bar', 'foo', 'foobar']);
    result = parsedGrammar.build({ element: 'foo', list: ['bar', 'foobar'], position: 2 });
    expect(result).to.be.equalTo(['bar', 'foobar', 'foo']);
    result = parsedGrammar.build({ element: null, list: ['bar', 'foobar'], position: 0 });
    expect(result).to.be.equalTo([null, 'bar', 'foobar']);
    result = parsedGrammar.build({ element: undefined, list: ['bar', 'foobar'], position: 0 });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ element: 'foo', list: [], position: 0 });
    expect(result).to.be.equalTo(['foo']);
    result = parsedGrammar.build({ element: 'foo', list: null, position: 0 });
    expect(result).to.be.null;
    result = parsedGrammar.build({ element: 'foo', list: undefined, position: 0 });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ element: 'foo', list: ['bar', 'foobar'], position: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ element: 'foo', list: ['bar', 'foobar'], position: undefined });
    expect(result).to.be.undefined;
  });

  it('should support remove function', function () {
    const expression = 'remove(list, position)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: ['bar', 'foobar'], position: 0 });
    expect(result).to.be.equalTo(['foobar']);
    result = parsedGrammar.build({ list: ['bar', 'foobar'], position: 1 });
    expect(result).to.be.equalTo(['bar']);
    result = parsedGrammar.build({ list: null, position: 0 });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined, position: 0 });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ list: ['bar', 'foobar'], position: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: ['bar', 'foobar'], position: undefined });
    expect(result).to.be.undefined;
  });

  it('should support reverse function', function () {
    const expression = 'reverse(list)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: [2, 1, 5] });
    expect(result).to.be.equalTo([5, 1, 2]);
    result = parsedGrammar.build({ list: [] });
    expect(result).to.be.equalTo([]);
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

  it('should support index of function', function () {
    const expression = 'index of(list, match)';
    const parsedGrammar = FEEL.parse(expression);
    let result = parsedGrammar.build({ list: [2, 1, 5], match: 5 });
    expect(result).to.be.equalTo([2]);
    result = parsedGrammar.build({ list: [2, 1, 5], match: 2 });
    expect(result).to.be.equalTo([0]);
    result = parsedGrammar.build({ list: [2, 1, 5, 2], match: 2 });
    expect(result).to.be.equalTo([0, 3]);
    result = parsedGrammar.build({ list: [2, 1, 2, 2, 5, 2], match: 2 });
    expect(result).to.be.equalTo([0, 2, 3, 5]);
    result = parsedGrammar.build({ list: [], match: 2 });
    expect(result).to.be.equalTo([]);
    result = parsedGrammar.build({ list: null, match: 2 });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined, match: 2 });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ list: [2, 1, 5], match: undefined });
    expect(result).to.be.undefined;
    result = parsedGrammar.build({ list: [2, 1, 5], match: null });
    expect(result).to.be.equalTo([]);
    result = parsedGrammar.build({ list: [2, null, 5], match: null });
    expect(result).to.be.equalTo([1]);
  });

  it('should support union function', function () {
    const condition = 'union(list1, list2)';
    const parsedGrammar = FEEL.parse(condition);
    let result = parsedGrammar.build({ list1: ['foo', 'bar'], list2: ['f', 'foo', 'b'] });
    expect(result).to.be.equalTo(['foo', 'bar', 'f', 'b']);
    result = parsedGrammar.build({ list1: null, list2: ['f', 'foo', 'b'] });
    expect(result).to.be.equalTo(['f', 'foo', 'b']);
    result = parsedGrammar.build({ list1: null, list2: null });
    expect(result).to.be.equalTo([]);
    result = parsedGrammar.build({ list1: undefined, list2: ['f', 'foo', 'b'] });
    expect(result).to.be.equalTo(['f', 'foo', 'b']);
    result = parsedGrammar.build({ list1: undefined, list2: undefined });
    expect(result).to.be.equalTo([]);
  });

  it('should support distinct values function', function () {
    const condition = 'distinct values(list)';
    const parsedGrammar = FEEL.parse(condition);
    let result = parsedGrammar.build({ list: ['foo', 'bar', 'f', 'foo', 'b'] });
    expect(result).to.be.equalTo(['foo', 'bar', 'f', 'b']);
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

  it('should support flatten function', function () {
    const condition = 'flatten(list)';
    const parsedGrammar = FEEL.parse(condition);
    let result = parsedGrammar.build({ list: [['foo', 'bar'], ['f', 'b'], 'foobar'] });
    expect(result).to.be.equalTo(['foo', 'bar', 'f', 'b', 'foobar']);
    result = parsedGrammar.build({ list: [['foo', 'bar'], ['f', 'b'], null] });
    expect(result).to.be.equalTo(['foo', 'bar', 'f', 'b', null]);
    result = parsedGrammar.build({ list: [['foo', 'bar'], ['f', 'b'], undefined] });
    expect(result).to.be.equalTo(['foo', 'bar', 'f', 'b', undefined]);
    result = parsedGrammar.build({ list: null });
    expect(result).to.be.null;
    result = parsedGrammar.build({ list: undefined });
    expect(result).to.be.undefined;
  });

});
