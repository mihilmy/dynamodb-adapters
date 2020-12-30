<p align="center">
    <img alt="DynamoDB Adapters" src="https://i.imgur.com/JRhPI6A.png"  />
  <h1 align="center">DynamoDB Adapters</h1>
</p>

According to [Adapter Wiki Page](https://en.wikipedia.org/wiki/Adapter) 🧐

> An adapter is a device that converts attributes of one electrical device or system to those of an otherwise incompatible device or system.
> Some modify power or signal attributes, while others merely adapt the physical form of one connector to another.

In Dynamo world, an adapter is something that will adapt to a more human readable experience using method chaining to create beautiful
expressions for you. The idea is to abstract all of DynamoDB's operations into three simple functions:

1. `read()`: Loads data from your table
2. `write()`: Saves data to your table
3. `delete()`: Deletes data from your table

The library is smart enough to pick the best low level operation based on your API query, so if you want to load four items the adapter will
do a `BatchGetItems` under the hood which is the most efficient operation instead of four parallel `Get` calls.

## Human Readable Expressions

One of the biggest motivations for writing this library is to have clean expressions whether its a conditional write or a filter expression
for reads. The goal is to write one line expression to save objects:

```typescript
adapters.write(object).if($P.objectId, "DoesNotExist").or($P.lastUpdatedAt, ">=", Date.now());
```

Compare that beautiful one liner with the following expression, that would achieve the same thing:

```typescript
const updateExpression = {
  Table: "Objects",
  Key: {
    objectId: 1,
    objectVersion: 'V0'
  }
  UpdateExpression: "SET #name=:name, #price=:price, #type=:type",
  ConditionalExpression: "attribute_not_exists(#objectId) OR #lastUpdatedAt >= :lastUpdatedAt",
  ExpressionAttributeNames: {
    "#objectId": "objectId",
    "#name": "name",
    "#price": "price",
    "#type": "type",
    "#lastUpdatedAt": "lastUpdatedAt",
  },
  ExpressionAttributeValues: {
    ":name": "ObjectOne",
    ":price": 700,
    ":type": "Games",
    ":lastUpdatedAt": 1609130078229
  },
};
```

## Infrastructure As Code

With the rise of cloudformation creating a templated way to manage infrastructure and the increase in CDK usage to generate the
cloudformation templates it has become obvious the ease of uniting our infra code and our application layer code. DynamoDB adapters uses the
same CDK constructs to interact with your table infer your keys.

## Locking

Lock items to prevent multiple writers from overwriting objects at the same time.

## Path Updates

DynamoDB allows you to update deeply nested JSON, however it becomes difficult to update a single path out of a given attribute due to
constraints imposed by the APIs. The DynamoDB adapters provides an easy way to manipulate a single path, handling creation of paths when
they do not exist.
