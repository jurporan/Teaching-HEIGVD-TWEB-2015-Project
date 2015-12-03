/**
 * Created by jermoret on 03.12.2015.
 */
$('.clicker').click(function(){
  $(this).nextUntil('.clicker').slideToggle('normal');
});
