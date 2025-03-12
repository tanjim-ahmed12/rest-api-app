// export type Language = 'English' | 'Frenc

export type Movie =   {
  id: number,
  backdrop_path: string,
  genre_ids: number[ ],
  original_language: string,
  original_title: string,
  adult: boolean,
  overview: string,
  popularity: number,
  poster_path: string,
  release_date: string,
  title: string,
  video: boolean,
  vote_average: number,
  vote_count: number
}

export type MovieCast = {
  movieId: number;
  actorName: string;
  roleName: string;
  roleDescription: string;
};
// Used to validate the query string of HTTP Get requests
export type MovieCastMemberQueryParams = {
  movieId: string;
  actorName?: string;
  roleName?: string
}

export type MovieReview = {
  reviewId: string;
  movieId: number;
  reviewerEmail: string;
  reviewText: string;
  rating: number; 
  createdAt: string;
  updatedAt?: string;
};

// Query parameters for fetching movie reviews
export type MovieReviewQueryParams = {
  movieId: string;
  reviewId?: string;
  reviewerEmail?: string;
};


 