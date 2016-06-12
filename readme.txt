Model:
  Object
    set('key', val)
    get('key') ->
      .set(val)
      if Array ->
        pop/push/shift/unshift/splice/sort/remove

  Related model
    reactive binding to model through mapper (filter/paginator/lazy load)

View:
  Binding to model

1. Collection
  1.1 load
  1.2 change
  1.3 add
  1.4 remove

2. Object
  2.1 change subscribe
  2.2 dependence
  2.3 autorun

3. Filter collection
  3.1 index
  3.2 map
  3.3 filter