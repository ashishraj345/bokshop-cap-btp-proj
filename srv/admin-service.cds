using {sap.capire.bookshop as my} from '../db/schema';

@requires:'Admin'
service Adminservice @(odata:'/admin'){
    entity Authors as projection on my.Authors;
    entity Books  as projection on my.Books;
    entity Genres as projection on my.Genres;
    
    function calculateDiscount(
        price:Decimal,
        percentage:Decimal
    )returns Decimal;
    
    action applyDiscount(
    ID: Integer,
    percentage: Decimal
  ) returns Decimal;

    type RemotePost {
      userId : Integer;
      id     : Integer;
      title  : String;
      body   : LargeString;
    }

    function getRemotePost(
      postId : Integer not null
    ) returns RemotePost;

    action createRemotePost(
      userId : Integer not null,
      title  : String not null,
      body   : LargeString not null
    ) returns RemotePost;
}
