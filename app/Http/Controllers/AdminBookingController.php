<?php
namespace App\Http\Controllers;
use App\Enums\BookingStatus;use App\Models\Booking;use App\Models\Facility;use Illuminate\Http\Request;use Inertia\Inertia;
class AdminBookingController extends Controller{
public function index(Request $request){$q=Booking::with(['facility','payment','invoice'])->latest();if($request->filled('status'))$q->where('status',$request->status);return Inertia::render('admin/bookings/index',['bookings'=>$q->paginate(20)->withQueryString(),'statuses'=>array_column(BookingStatus::cases(),'value'),'facilities'=>Facility::where('booking_enabled',true)->orderBy('name')->get(['id','name','booking_price_per_hour']),'filters'=>$request->only('status')]);}
public function show(Booking $booking){return Inertia::render('admin/bookings/show',['booking'=>$booking->load(['facility','payment','invoice','user'])]);}
public function updateFacility(Request $request,Facility $facility){$data=$request->validate(['booking_enabled'=>['required','boolean'],'booking_price_per_hour'=>['required','integer','min:1']]);$facility->update($data);return back()->with('success','Pengaturan booking fasilitas diperbarui.');}
}
