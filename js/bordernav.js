$(document).ready(function(){
    $('.noactive').hover(function() {
        $('.active').css('border-color','transparent');
        }, function() {
            $('.active').css('border-color','black');
    });
});