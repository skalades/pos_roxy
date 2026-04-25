import { Search, Scissors, Package, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { formatIDR } from '@/utils/currency';
import axios from 'axios';

export default function PosProductGrid({ 
    services, 
    categories, 
    activeTab, 
    setActiveTab, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    onItemClick,
    showMobileCart,
    cart = []
}) {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const isInCart = (id, type) => {
        return cart.some(item => item.id === id && item.type === type);
    };

    useEffect(() => {
        if (activeTab === 'products') {
            setLoadingProducts(true);
            const delayDebounceFn = setTimeout(() => {
                axios.get(route('api.pos.products'), {
                    params: {
                        search: searchQuery,
                        category_id: selectedCategory
                    }
                }).then(res => {
                    setProducts(res.data);
                    setLoadingProducts(false);
                }).catch(err => {
                    console.error("Error fetching products", err);
                    setLoadingProducts(false);
                });
            }, 300); // 300ms debounce
            return () => clearTimeout(delayDebounceFn);
        }
    }, [activeTab, searchQuery, selectedCategory]);

    const filteredItems = activeTab === 'services' 
        ? services.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
            return matchesSearch && matchesCategory;
        })
        : products;

    return (
        <div className={`flex-1 flex flex-col gap-4 lg:gap-6 bg-white rounded-[2rem] border border-slate-200 p-4 lg:p-6 shadow-sm overflow-hidden ${showMobileCart ? 'hidden landscape:flex lg:flex' : 'flex'}`}>
            
            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                        onClick={() => {setActiveTab('services'); setSelectedCategory(null);}}
                        className={`flex-1 sm:flex-none px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-white text-roxy-primary shadow-sm' : 'text-slate-500'}`}
                    >
                        Layanan
                    </button>
                    <button 
                        onClick={() => {setActiveTab('products'); setSelectedCategory(null);}}
                        className={`flex-1 sm:flex-none px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white text-roxy-primary shadow-sm' : 'text-slate-500'}`}
                    >
                        Produk
                    </button>
                </div>

                <div className="relative flex-1 sm:max-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text"
                        placeholder="Cari..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl text-xs lg:text-sm focus:ring-2 focus:ring-roxy-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
                <button 
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-1.5 rounded-full text-[10px] lg:text-xs font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-roxy-accent text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                    Semua
                </button>
                {categories.filter(c => c.type === (activeTab === 'services' ? 'service' : 'product')).map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-1.5 rounded-full text-[10px] lg:text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-roxy-accent text-white' : 'bg-slate-100 text-slate-500'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Grid Items */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-4 pb-24 lg:pb-4">
                {filteredItems.map(item => {
                    const selected = isInCart(item.id, activeTab === 'services' ? 'service' : 'product');
                    return (
                        <button 
                            key={item.id}
                            onClick={() => onItemClick(item, activeTab === 'services' ? 'service' : 'product')}
                            className={`group relative bg-white border p-4 lg:p-4 rounded-[2rem] text-left hover:border-roxy-primary hover:shadow-xl hover:shadow-roxy-primary/5 transition-all duration-300 flex flex-col gap-3 active:scale-95 active:bg-slate-50 ${selected ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-100'}`}
                        >
                            <div className="w-full aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden mb-1 relative">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        {activeTab === 'services' ? <Scissors size={24} className="lg:w-8 lg:h-8" /> : <Package size={24} className="lg:w-8 lg:h-8" />}
                                    </div>
                                )}
                                
                                {selected && (
                                    <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-[1px] flex items-center justify-center">
                                        <div className="bg-white text-teal-500 p-2 rounded-full shadow-lg scale-110 animate-in zoom-in">
                                            <CheckCircle2 size={24} strokeWidth={3} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h5 className={`font-bold text-[12px] lg:text-sm line-clamp-2 leading-tight h-10 ${selected ? 'text-teal-600' : 'text-slate-800'}`}>{item.name}</h5>
                                <p className="text-roxy-primary font-black text-[13px] lg:text-sm mt-1">{formatIDR(item.price)}</p>
                            </div>
                            <div className={`absolute top-2 right-2 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <div className={`${selected ? 'bg-teal-500' : 'bg-roxy-primary'} text-white p-1.5 rounded-lg lg:rounded-xl shadow-lg`}>
                                    {selected ? <Plus size={14} className="lg:w-4 lg:h-4" /> : <Plus size={14} className="lg:w-4 lg:h-4" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
