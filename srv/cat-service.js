


export default (srv) => {
  srv.after("each", "Books", (book) => {
    if (book.stock > 111) {
      book.title = `${book.title} (High stock)`;
    }
  });
};