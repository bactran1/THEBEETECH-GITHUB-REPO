$(document).ready(function(){
    // Activate Carousel
    $("#carouselId-1").carousel({interval: 3000});
    $('#carouselId-1').carousel().swipeCarousel({
        // options here
        sensitivity:'high'
      });
});

