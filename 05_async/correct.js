async function checkPeapleHeight() {

  const promises = keysArr.map((peapleName, keyNumber) => searchKey(peapleName, keyNumber));



  try {

      await Promise.all(promises);

      printPeapleMap(); // Вывод результатов после завершения всех запросов

  } catch (error) {

      console.error("Ошибка при выполнении запросов:", error);

  }

}


async function searchKey(peapleName, keyNumber) {

  let qtyFoundedPeaple = 0;


  try {

      const response = await fetch(urlSWAPI + peapleName);

      const contentType = response.headers.get("content-type");



      if (contentType && contentType.includes("application/json")) {

          const json = await response.json();

          myJSON = json.result;


          for (let i = 0; i < myJSON.length; i++) {

              foundedPeapleMap.set(myJSON[i].properties.name, myJSON[i].properties.height);

              qtyFoundedPeaple++;

          }

      } else {

          throw new TypeError("В SWAPI к сожалению нет структуры JSON!");

      }

  } catch (error) {

      console.error(error);

      // Считаем, что запрос вернул ноль записей, продолжаем работу

  } finally {

      resultArr[keyNumber] = qtyFoundedPeaple;

      if (qtyFoundedPeaple === 0) {

          console.log("No results found for " + peapleName);

      }

  }

}
