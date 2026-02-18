import math

# Generate an STL file for M6 bolt with 10mm hex head
# Simple ASCII STL format

def write_stl(filename, triangles):
    """Write triangles to ASCII STL file"""
    with open(filename, 'w') as f:
        f.write("solid bolt\n")
        for tri in triangles:
            # Calculate normal
            v0 = tri[0]
            v1 = tri[1]
            v2 = tri[2]
            
            # Cross product for normal
            ux = v1[0] - v0[0]
            uy = v1[1] - v0[1]
            uz = v1[2] - v0[2]
            vx = v2[0] - v0[0]
            vy = v2[1] - v0[1]
            vz = v2[2] - v0[2]
            
            nx = uy * vz - uz * vy
            ny = uz * vx - ux * vz
            nz = ux * vy - uy * vx
            
            # Normalize
            length = math.sqrt(nx*nx + ny*ny + nz*nz)
            if length > 0:
                nx, ny, nz = nx/length, ny/length, nz/length
            
            f.write(f"  facet normal {nx:.6f} {ny:.6f} {nz:.6f}\n")
            f.write("    outer loop\n")
            for v in tri:
                f.write(f"      vertex {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
            f.write("    endloop\n")
            f.write("  endfacet\n")
        f.write("endsolid bolt\n")

def generate_hex_head(radius, height, segments=6):
    """Generate triangles for hex head (prism)"""
    triangles = []
    
    # Top and bottom vertices
    top_vertices = []
    bottom_vertices = []
    
    for i in range(segments):
        angle = 2 * math.pi * i / segments
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        top_vertices.append((x, y, height))
        bottom_vertices.append((x, y, 0))
    
    # Top face (fan triangulation from center)
    center_top = (0, 0, height)
    for i in range(segments):
        j = (i + 1) % segments
        triangles.append([center_top, top_vertices[j], top_vertices[i]])
    
    # Bottom face (fan triangulation from center)
    center_bottom = (0, 0, 0)
    for i in range(segments):
        j = (i + 1) % segments
        triangles.append([center_bottom, bottom_vertices[i], bottom_vertices[j]])
    
    # Side faces (two triangles per side)
    for i in range(segments):
        j = (i + 1) % segments
        triangles.append([top_vertices[i], top_vertices[j], bottom_vertices[i]])
        triangles.append([top_vertices[j], bottom_vertices[j], bottom_vertices[i]])
    
    return triangles

def generate_cylinder(radius, height, segments=32, z_offset=0):
    """Generate triangles for cylinder"""
    triangles = []
    
    top_vertices = []
    bottom_vertices = []
    
    for i in range(segments):
        angle = 2 * math.pi * i / segments
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        top_vertices.append((x, y, height + z_offset))
        bottom_vertices.append((x, y, z_offset))
    
    # Top face
    center_top = (0, 0, height + z_offset)
    for i in range(segments):
        j = (i + 1) % segments
        triangles.append([center_top, top_vertices[j], top_vertices[i]])
    
    # Bottom face
    center_bottom = (0, 0, z_offset)
    for i in range(segments):
        j = (i + 1) % segments
        triangles.append([center_bottom, bottom_vertices[i], bottom_vertices[j]])
    
    # Side faces
    for i in range(segments):
        j = (i + 1) % segments
        triangles.append([top_vertices[i], top_vertices[j], bottom_vertices[i]])
        triangles.append([top_vertices[j], bottom_vertices[j], bottom_vertices[i]])
    
    return triangles

def create_bolt():
    """Create M6 bolt with 10mm hex head"""
    
    # Dimensions
    head_flat_to_flat = 10.0  # mm
    head_radius = head_flat_to_flat / 2 / math.cos(math.pi/6)  # circumscribed radius
    head_height = 4.0  # mm
    
    shank_diameter = 6.0  # mm (M6)
    shank_radius = shank_diameter / 2
    shank_length = 26.0  # mm (30mm total - 4mm head)
    
    # Generate geometry
    head_tris = generate_hex_head(head_radius, head_height, 6)
    
    # Shank goes below head (offset by negative shank_length)
    shank_tris = generate_cylinder(shank_radius, shank_length, 32, -shank_length)
    
    # Combine
    all_tris = head_tris + shank_tris
    
    return all_tris

# Generate and save
if __name__ == "__main__":
    triangles = create_bolt()
    write_stl("m6_bolt_10mm_head.stl", triangles)
    print(f"Generated bolt with {len(triangles)} triangles")
    print("File: m6_bolt_10mm_head.stl")
    print("Dimensions: M6 thread, 10mm hex head, 30mm total length")
