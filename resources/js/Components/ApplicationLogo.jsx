export default function ApplicationLogo(props) {
    return (
        <div {...props} className={`flex items-center justify-center ${props.className}`}>
            <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                        Agenda<span className="text-gray-900">Pro</span>
                    </div>
        </div>
    );
}
