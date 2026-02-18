// M6 Bolt with 10mm Hex Head
// Standard ISO 4014 / DIN 931 dimensions

$fn = 100;  // Smoothness

// Parameters
head_diameter = 10;      // 10mm across flats (hex head)
head_height = 4;         // Standard head height for M6
shank_diameter = 6;      // M6 thread
shank_length = 30;       // Total bolt length
thread_length = 20;      // Threaded portion length

// Hex head (circumscribed circle diameter for hex = across flats / cos(30))
head_radius = head_diameter / 2 / cos(30);

module bolt() {
    // Hex head
    translate([0, 0, shank_length])
        cylinder(h = head_height, r = head_radius, $fn = 6);
    
    // Shank (unthreaded portion)
    translate([0, 0, thread_length])
        cylinder(h = shank_length - thread_length, d = shank_diameter);
    
    // Threaded portion (simplified as cylinder with threads visual)
    cylinder(h = thread_length, d = shank_diameter);
}

// Render the bolt
bolt();
