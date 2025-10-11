### ExpressStart

The idea is simple, ExpressStart is just a CLI tool that helps you scaffold new express project with options capability,
it also tries to extend array and object utilities (like lodash but built-in) using JavaScript's prototypes.

Setting up new express projects a lot of times come off as an headache when not done properly or there's just a lot of packages that does the same thing
in the project setup but are configured differently (it's annoying I know), so I built this to quickly scaffold a new express project as fast as you can create a new Next.js project, just few clicks and selections and you're done!.

#### To install ExpressStart?

It's very easy, just run

```ts
  npm install -g create-express-start
```

#### And to use it....

Run this command and use the wizard to setup your project

```ts
  create-express-start <project-name>
```

#### What you should be expecting?

A better version is coming next, rich in useful utils and with ability to add only utils you need, so we can avoid project polution since we work on JavaScript prototypes

The feature will look something like:

```
  create-express-start add chunk // To add the chunk method

  create-express-start add pick  // To add the pick method
```

and so on.

#### Contribution

This project is open to everyone, make improvement MRs and create an issue if you see a bug or an error.
