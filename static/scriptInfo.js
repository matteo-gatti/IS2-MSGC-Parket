function random() {
    $('.card').each(function() {
        var randomLeft = Math.floor(Math.random() * 100);
        var randomTop = Math.floor(Math.random() * 100);
        $(this).animate({
            left: randomLeft + '%',
            top: randomTop + '%'
        }, 200);
    });
}