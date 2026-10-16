import cds from '@sap/cds';
import { executeHttpRequest } from "@sap-cloud-sdk/http-client";
const { SELECT, UPDATE } = cds.ql;

export default (srv) => {
  srv.before(["CREATE", "UPDATE"], "Books", (req) => {
    console.log("HOOK EXECUTED:", req.data.price);

    if (req.data.price != null && req.data.price < 0) {
      req.error(400, "Price cannot be negative");
    }
  });

  srv.on("READ", "Books", async (req, next) => {
    console.log("ON HANDLER: Reading books");

    const result = await next();

    console.log("ON HANDLER: CAP finished reading books");

    return result;
  });

  srv.on("calculateDiscount",(req)=>{
    const price= Number(req.data.price);
    const percentage= Number(req.data.percentage);

    if (price<0){
      return req.error(400,"price should be a non-negative")
    }
    if ( percentage <0 || percentage>100){
    return req.error(400,"percentage must be between 0 and 100");
    }
    
  
  const discAmt=(price*percentage)/100;
  return Number(discAmt);
  });

  srv.on("applyDiscount",async (req)=>{
    const {Books}=srv.entities;
    const ID = Number(req.data.ID);
    const percentage= Number(req.data.percentage);

    if (ID<=0){
      return req.reject(400,"id must be +ve")
    }
    if (percentage<0 || percentage>100){
      return req.reject(400,'Percentage must be between 0 and 100');
    }

    const book=await SELECT.one.from(Books).where({ID});
    if(!book){
      return req.reject(400,"book id not found")
    }

    const oldprice = Number(book.price)
    if(oldprice<0){
      return req.reject(400,'book does not have a valid price')
    }

    const newprice=Number(
      (oldprice*(1-percentage/100))
    );
    await UPDATE(Books).set({price:newprice}).where({ID});
    return newprice;
    
  });

  srv.on("getRemotePost", async (req) => {
  const postId = Number(req.data.postId);

  if (!Number.isInteger(postId) || postId < 1) {
    return req.reject(400, "postId must be a positive integer");
  }

  try {
    const response = await executeHttpRequest(
      { destinationName: "BOOKSHOP_EXTERNAL_API" },
      {
        method: "GET",
        url: `/posts/${postId}`,
        timeout: 10000
      }
    );

    const post = response.data;

    return {
      userId: Number(post.userId),
      id: Number(post.id),
      title: post.title,
      body: post.body
    };
  } catch (error) {
    console.error("Remote GET failed:", error.message);
    return req.reject(502, "Unable to retrieve the external post");
  }
});

  srv.on("createRemotePost", async (req) => {
  const userId = Number(req.data.userId);
  const { title, body } = req.data;

  if (!Number.isInteger(userId) || userId < 1) {
    return req.reject(400, "userId must be a positive integer");
  }

  if (!title?.trim() || !body?.trim()) {
    return req.reject(400, "title and body are required");
  }

  try {
    const response = await executeHttpRequest(
      { destinationName: "BOOKSHOP_EXTERNAL_API" },
      {
        method: "POST",
        url: "/posts",
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          userId,
          title,
          body
        },
        timeout: 10000
      }
    );

    const post = response.data;

    return {
      userId: Number(post.userId),
      id: Number(post.id),
      title: post.title,
      body: post.body
    };
  } catch (error) {
    console.error("Remote POST failed:", error.message);
    return req.reject(502, "Unable to create the external post");
  }
});


};
