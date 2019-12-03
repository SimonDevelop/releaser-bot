# Code of Conduct Guide

We require that all contributions meet at least the following guidelines:

* Use camelCase for variables and methods/functions.
* Avoid aliases for functions: `sizeof`, `join` and etc.
* Avoid global variables.
* Avoid strict comparisons if not necessary.
* Use `typeof x === "undefined"` for null checking.
* Avoid "Yoda conditions", where constants are placed first in comparisons:

```js
if (someParameter) {
}
```

* Don't forget about empty lines after logical blocks:

```js
function simpleMethod(a)
{
    let result = 1 + 2
                                // $result is not related to if block, please write empty line
    let b = a
    if (b) {
        result = 1
    }
                                // Empty line is needed there
    return result
}
```
