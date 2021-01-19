# Reading

Reading data from DynamoDB involves three different primitive operations:

1. `[Batch]Get`: Definitive reading meaning that if the table is queried by the partition key and the sort key if the table does have
   provide it.
1. `Query`: A slightly more flexible where you can read the full partition, only beneficial when reading off an index or just with partition
   key.
1. `Scan`: A very flexible call that just loads all the data from your table.

# Writing

Writing data to DynamoDB involves two different primitive operations:

1. `[Batch]Put`: Blind writing; meaning that it will clobber any existing attributes of a previous item stored.
1. `Update`: Edits existing item attributes or adds a new item if one does not already exist.

### Update API

Updating items using the `UpdateItem` API is the most sophisticated API structure, simply because it provides a lot of functionality than
just blindly writing `PutItem`. Let explore everything we need to support, if you need further complexity I highly recommend you use a Put
with a locking configuration so you can get full control on the client side.

1. [Set Path Only](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.SET.AddingNestedMapAttributes)

   - Path has to have already been constructed for (PathDepth - 1) otherwise we will need to retry and shift levels.
   - Path needs to handle special indexing of arrays that use the `[]` operator
   - Inserting into arrays at indexes will overwrite the existing items or will insert at the end of the list if the index does not exist.
   - Each path can only appear once in the entire expression!!

2. [Set Data Structure Support](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.ADD)

   - Support for basic ADD and DELETE operations into sets
   - Should be able to natively use the `Set` interface provided in every javascript runtime now

3. [Set once](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.SET.UpdatingListElements)

   - Its common practice that you may need to use a set once operation

4. [Arithmetic](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.SET.IncrementAndDecrement)

   - Attribute needs to exist for using SET which is why it may be better to use ADD for top level attributes
   - When the arithmetic is a path we MUST use SET since ADD only works on top level.
   - Similar to path updates we should support a shift one level up

5. [Inserting elements to list front and back](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.SET.UpdatingListElements)

   - Appending elements to the back
   - Appending elements to the front

6. [Use values from other paths within the item](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.SET)

   - Values can be paths as well they do not need to be provided by the client

The following snippet illustrates how the simplistic output should be

```typescript
const object = {
  name: {
    first: "omar",
    last: "mihilmy",
  },
  connections: new Set<number>([128, 169, 178]),
  endorsements: {
    java: 1,
  },
  session: {
     current: "f478badee7a96901",
     previous: "db6e52581f500666"
  }
  createdAt: new Date().toISOString(),
};

adapter
  .update(object)
  .setPathOnly($user.name.first) // Powerful function allowing the setting of specific paths
  .setOnce($user.createdAt) // Will only set the created at if do not already exist
  .addNumber($user.endorsements.java) // Will add the number to the items path
  .append($user.skills, "Front"); // Appends the value at the end | Supports Sets too which are unordered
  .delete($user.connections, Set.of([128])); // Deletes the entry from the set
  .delete($user.session.current) // Removes the path from the document
```
