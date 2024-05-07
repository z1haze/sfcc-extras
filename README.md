Rules Engine
===

> A rules engine for Salesforce Commerce Cloud

### Why do I need this?

As early adopters of Salesforce's SCAPI, we found there was no built-in way to segment personalized information to our
customers in our mobile app. We developed
this project in order to facilitate a need to deliver individuals personalized content on in our mobile application
based on a wide range of criteria. This project
is heavily inspired by https://github.com/andrewbrg/rulepilot -- huge credit to the author!

### Usage

```js
const RulesEngine = require('*/cartridge/scripts/lib/RulesEngine');
const engine = new RulesEngine();

const rule = {...};
const criteria = {...};

engine.evaluate(rule, criteria);
// returns true or false
```

### Basic Example

A business usecase for the following example is to target customers who have push notifications disabled, and show them
some sort of banner that will encourage them
to push notifications.

```js
const rule = {
  conditions: {
    all: [
      {
        field: "pushEnabled",
        operator: "equals",
        value: false
      }
    ]
  },
};

/**
 * The criteria in this example would be the customer's device information, submitted to the server from the app
 */
const criteria = {
  pushEnabled: false
};

const hasPushDisabled = engine.evaluate(rule, criteria); // true
```

### Multi Condition Example

Another simple example would be to target customers by their gender, and whether they are signed in. So below, we are
targeted sign in females.

```js
const RulesEngine = require('*/cartridge/scripts/lib/RulesEngine');
const engine = new RulesEngine();

const rule = {
  conditions: {
    all: [
      {
        field: 'authenticated',
        operator: 'equals',
        value: true
      },
      {
        field: 'gender',
        operator: 'equals',
        value: 2
      }
    ]
  }
}

const criteria = {
  authenticated: customer.authenticated,
  gender: customer.profile ? customer.profile.gender.value : 0
};

const isSignedInFemale = engine.evaluate(rule, criteria);
```

#### Condition Types

There are three (3) types of conditions which can be used in a rule:

* all - All criteria in the condition must be met
* any - Any criteria in the condition must be met
* none - No criteria in the conditions must be met (none === !all)

Condition types can be mixed and matched or nested to create complex rules.

#### Operators

These are the operators available for a constraint and how they are used:

* `equals`: Applies JavaScript equality (==) operator to criterion and constraint value
* `does not equal`: Applies JavaScript inequality (!=) operator to criterion and constraint value
* `greater than`: Applies JavaScript greater than (>) operator to criterion and constraint value
* `less than`: Applies JavaScript less than (<) operator to criterion and constraint value
* `greater than or equal`: Applies JavaScript greater than or equal (>=) operator to criterion and constraint value
* `less than or equal`: Applies JavaScript less than or equal (<=) operator to criterion and constraint value
* `exists`: Applies the `!empty()` function in SFCC to the criterion
* `does not exist`: Applies the `empty()` function in SFCC to the criterion
* `in`: Tests if the criterion is an element of the constraint value (value must be an array)
* `not in`: Tests if the criterion is not an element of the constraint value (value must be an array)
* `contains`: Tests if the constraint value is an element of the criterion (criterion must be an array)
* `contains any`: Tests if any element in the constraint value is an element of the criterion (criterion and constraint
  value must be an array)
* `not contains`: Tests if the constraint value is not an element of the criterion (criterion must be an array)
* `not contains any`: Tests if any element in the constraint value is bot an element of the criterion (criterion and
  constraint value must be an array)
* `matches`: Tests if the constraint value matches a regular expression (criterion must be a valid regex)
* `does not match`: Tests if the constraint value does not match a regular expression (criterion must be a valid regex)

### Criteria With Nested Properties

In some cases, the criteria which is used to evaluate a rule might be more complex objects with nested properties.

For example, we might want to evaluate a rule against a `Customer` object which has a profile property which contains
the customer's profile information.

```js
const RulesEngine = require('*/cartridge/scripts/lib/RulesEngine');
const engine = new RulesEngine();

const rule = {
  conditions: {
    all: [
      {
        field: 'customer.authenticated',
        operator: '==',
        value: true
      },
      {
        field: 'customer.profile.gender',
        operator: '==',
        value: 1
      }
    ]
  }
}

const criteria = {
  customer: customer // global
};

engine.evaluate(rule, criteria);
```

### Rule Validation

Validation can be performed on a rule to ensure it is valid and properly structured.

The `validate()` method will return `true` if the rule is valid, otherwise it will return an error message describing
the problem along with the problem node from the rule for easy debugging.

```js
const rule = {...};

const result = engine.validate(rule);
```

### Inspiration

Special thanks to https://github.com/andrewbrg/rulepilot for the inspiration to create this cartridge
