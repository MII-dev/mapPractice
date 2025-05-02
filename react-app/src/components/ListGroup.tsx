// import { MouseEvent } from "react";

import { useState } from "react";

interface Props {
  items: string[];
  headind: string;
}

function ListGroup({ items, heading }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // items = []

  //   const handleClick = (event: MouseEvent) => console.log(event);

  const getMessage = () => {
    return items.length === 0 ? <p>No items</p> : null;
  };

  return (
    <>
      <h1>{heading}</h1>
      {getMessage()}
      {items.length === 0 && <p>No items</p>}
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            key={item}
            className={
              selectedIndex === index
                ? "list-group-item active"
                : "list-group-item"
            }
            onClick={() => {
              setSelectedIndex(index);
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export default ListGroup;
