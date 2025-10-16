// import { MouseEvent } from "react"; 
// (Закоментований імпорт для типізації подій миші — поки не використовується)
// (Commented import for mouse event typing — not used yet)

import { useState } from "react";

// Опис типів пропсів, які приймає компонент (Define the props interface)
interface Props {
  items: string[];   // Масив елементів для відображення (Array of items to display)
  headind: string;   // Заголовок списку (Heading of the list)
}

// Компонент ListGroup — відображає список з можливістю вибору елемента
// (ListGroup component — displays a selectable list)
function ListGroup({ items, heading }: Props) {
  // Стан для збереження індексу вибраного елемента 
  // (State to store the index of the selected item)
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Приклад обробника кліку — закоментований (Example click handler — commented)
  // const handleClick = (event: MouseEvent) => console.log(event);

  // Функція, що повертає повідомлення, якщо список порожній 
  // (Function that returns a message if the list is empty)
  const getMessage = () => {
    return items.length === 0 ? <p>No items</p> : null;
  };

  return (
    <>
      {/* Відображаємо заголовок списку (Render the list heading) */}
      <h1>{heading}</h1>

      {/* Відображаємо повідомлення, якщо немає елементів (Show message if list is empty) */}
      {getMessage()}
      {items.length === 0 && <p>No items</p>}

      {/* Основний список елементів (Main list of items) */}
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            key={item}
            className={
              selectedIndex === index
                ? "list-group-item active" // Активний (вибраний) елемент (Active/selected item)
                : "list-group-item"        // Звичайний елемент (Regular item)
            }
            onClick={() => {
              // Зберігаємо індекс вибраного елемента 
              // (Store index of the selected item)
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
// Експортуємо компонент для використання в інших файлах 
// (Export the component for use in other files)
