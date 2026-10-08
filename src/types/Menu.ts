type Course = {
  name: string;
  price: string;
  diets: string;
};

type Menu = {
  courses: Course[];
};

export {Menu};
