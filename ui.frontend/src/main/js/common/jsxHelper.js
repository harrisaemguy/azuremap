const CapRegex = /^[A-Z]\S+$/gm;

/* 
 A jsx pragma method to create html dom elements.
 It supports jsx composition, 
 */
export function createElement(tag, props = {}, ...children) {
  //console.log(tag + ', ' + typeof tag);

  if (typeof tag === 'function') {
    /* support function */
    //console.log('is render function.');
    return tag(props, children);
  } else if (tag === 'fragment') {
    /* support fragment */
    //console.log('using fragment.');
    return children;
  } else if (typeof tag === 'object') {
    /* support composition, and fragments */
    //console.log('is non html tag.');
    return tag;
  } else {
    //const elem = Object.assign(document.createElement(tag), props);
    const elem = document.createElement(tag);
    Object.entries(props || {}).forEach(([name, value]) => {
      if (name === 'className') {
        name = 'class';
      }
      if (name === 'htmlFor') {
        name = 'for';
      }

      if (name.startsWith('on') && name.toLowerCase() in window) {
        elem.addEventListener(name.toLowerCase().substr(2), value);
      } else {
        elem.setAttribute(name, value.toString());
      }
    });

    for (const child of children) {
      if (Array.isArray(child)) {
        elem.append(...child);
      } else {
        elem.append(child);
      }
    }
    return elem;
  }
}

/*
const App4 = <div className="app4">app4...</div>;

const Frg1 = (
  <>
    <p>This is a paragraph1 in a fragment</p>
    <p>This is a paragraph2 in a fragment</p>
  </>
);

const SayHello = (props) => (
  <div>
    <h3>Hello {props ? props.name : 'world'}</h3>
    <p>I hope you're having a good day</p>
  </div>
);

// Create some dom elements
const App5 = (props) => (
  <div className="app">
    <h1 className="title">Hello, world!</h1>
    <p>Welcome back, {props.name}</p>
    <p>
      <strong>Your friends are:</strong>
    </p>
    <ul>
      {props.friends.map((name) => (
        <li>{name}</li>
      ))}
    </ul>
    <App4 />
    <SayHello name={props.name} />
    <Frg1 />
  </div>
);
*/
